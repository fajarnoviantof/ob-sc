// =========================================================
// SMC OB SCANNER
// FRONTEND
// DIRECT GITHUB ACTIONS
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const RESULTS_URL =
    "results.json";

const STATUS_URL =
    "scan_status.json";


// Repository GitHub
const GITHUB_OWNER =
    "fajarnoviantof";

const GITHUB_REPO =
    "ob-sc";

const GITHUB_WORKFLOW =
    "scanner.yml";

const GITHUB_BRANCH =
    "main";


// =========================================================
// GITHUB TOKEN
// =========================================================
//
// ISI TOKEN GITHUB DI SINI
//
// Contoh:
// const GITHUB_TOKEN = "github_pat_xxxxxxxxxxxxxxxxx";
//
// JANGAN tambahkan < >
//
// =========================================================

const GITHUB_TOKEN =
    "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";


const GITHUB_DISPATCH_URL =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`;


// =========================================================
// GLOBAL
// =========================================================

let scanRunning =
    false;

let statusTimer =
    null;

let resultTimer =
    null;


// =========================================================
// DOM HELPER
// =========================================================

function el(id) {

    return document.getElementById(id);

}


// =========================================================
// TOKEN CHECK
// =========================================================

function tokenIsConfigured() {

    return (
        GITHUB_TOKEN &&
        GITHUB_TOKEN !==
            "ISI_TOKEN_GITHUB_DI_SINI"
    );

}


// =========================================================
// LOAD JSON
// =========================================================

async function loadJson(url) {

    const response =
        await fetch(
            `${url}?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}`
        );

    }

    return await response.json();

}


// =========================================================
// LOAD RESULTS
// =========================================================

async function loadResults() {

    try {

        const data =
            await loadJson(
                RESULTS_URL
            );

        updateResults(
            data
        );

        return data;

    }
    catch (error) {

        console.error(
            "Gagal membaca results.json:",
            error
        );

        return null;

    }

}


// =========================================================
// LOAD STATUS
// =========================================================

async function loadStatus() {

    try {

        const data =
            await loadJson(
                STATUS_URL
            );

        updateStatus(
            data
        );

        return data;

    }
    catch (error) {

        console.error(
            "Gagal membaca scan_status.json:",
            error
        );

        return null;

    }

}


// =========================================================
// UPDATE STATUS
// =========================================================

function updateStatus(data) {

    if (!data) {
        return;
    }


    const status =
        String(
            data.status || ""
        ).toLowerCase();


    const dot =
        el("statusDot");

    const statusText =
        el("statusText");


    if (status === "running") {

        if (dot) {

            dot.className =
                "dot active";

        }

        if (statusText) {

            statusText.textContent =
                "Scanner Running";

        }

    }
    else if (status === "success") {

        if (dot) {

            dot.className =
                "dot";

        }

        if (statusText) {

            statusText.textContent =
                "Scanner Ready";

        }

    }
    else if (status === "failed") {

        if (dot) {

            dot.className =
                "dot error";

        }

        if (statusText) {

            statusText.textContent =
                "Scanner Error";

        }

    }
    else {

        if (dot) {

            dot.className =
                "dot";

        }

        if (statusText) {

            statusText.textContent =
                "Scanner Ready";

        }

    }


    // -----------------------------------------
    // Last Scan
    // -----------------------------------------

    if (el("lastScan")) {

        el("lastScan").textContent =
            data.finished_at ||
            data.generated_at ||
            "-";

    }


    // -----------------------------------------
    // Progress
    // -----------------------------------------

    const processed =
        Number(
            data.processed || 0
        );

    const total =
        Number(
            data.total_tickers || 0
        );


    if (
        el("scanProgress")
    ) {

        if (total > 0) {

            el("scanProgress").textContent =
                `${processed} / ${total}`;

        }
        else {

            el("scanProgress").textContent =
                "-";

        }

    }


    // -----------------------------------------
    // Duration
    // -----------------------------------------

    if (
        el("scanDuration")
    ) {

        el("scanDuration").textContent =
            data.duration_text ||
            "-";

    }


    // -----------------------------------------
    // Errors
    // -----------------------------------------

    if (
        el("scanErrors")
    ) {

        el("scanErrors").textContent =
            data.errors ??
            "-";

    }


    // -----------------------------------------
    // Progress bar
    // -----------------------------------------

    const progressFill =
        el("progressFill");


    if (progressFill) {

        if (total > 0) {

            const percent =
                Math.min(
                    100,
                    Math.max(
                        0,
                        (processed / total) * 100
                    )
                );

            progressFill.style.width =
                `${percent}%`;

        }
        else {

            progressFill.style.width =
                "0%";

        }

    }


    // -----------------------------------------
    // LIVE PANEL
    // -----------------------------------------

    if (status === "running") {

        setLiveRunning();

    }
    else if (status === "success") {

        setLiveReady();

    }
    else if (status === "failed") {

        setLiveFailed();

    }

}


// =========================================================
// UPDATE RESULTS
// =========================================================

function updateResults(data) {

    if (!data) {
        return;
    }


    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    if (
        el("totalTickers")
    ) {

        el("totalTickers").textContent =
            data.total_tickers ??
            "-";

    }


    if (
        el("candidateCount")
    ) {

        el("candidateCount").textContent =
            data.candidates ??
            "-";

    }


    if (
        el("generatedAt")
    ) {

        el("generatedAt").textContent =
            data.generated_at ??
            "-";

    }


    // -----------------------------------------
    // TABLE
    // -----------------------------------------

    const body =
        el("resultBody");


    if (!body) {
        return;
    }


    const rows =
        Array.isArray(data.data)
            ? data.data
            : [];


    if (
        rows.length === 0
    ) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="loading"
                >
                    Tidak ada kandidat
                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML =
        rows.map(
            (row, index) => {

                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${safe(row.ticker)}
                            </strong>
                        </td>

                        <td>
                            ${safe(row.ob_range)}
                        </td>

                        <td>
                            ${formatNumber(row.sl)}
                        </td>

                        <td>
                            ${formatNumber(row.tp)}
                        </td>

                        <td>
                            ${formatNumber(row.rr)}
                        </td>

                        <td>
                            ${formatPercent(row.distance)}
                        </td>

                        <td>
                            ${safe(row.bos_age)}
                        </td>

                        <td>
                            ${formatPercent(row.ob_size)}
                        </td>

                        <td>
                            <strong>
                                ${formatNumber(row.score)}
                            </strong>
                        </td>

                    </tr>

                `;

            }
        ).join("");

}


// =========================================================
// SAFE TEXT
// =========================================================

function safe(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================================================
// FORMAT NUMBER
// =========================================================

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return safe(value);

    }


    return number.toLocaleString(
        "id-ID",
        {
            maximumFractionDigits: 2
        }
    );

}


// =========================================================
// FORMAT PERCENT
// =========================================================

function formatPercent(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return safe(value);

    }


    return `${number}%`;

}


// =========================================================
// LIVE STATE
// =========================================================

function setLiveStarting() {

    const liveStatus =
        el("liveStatus");

    const scanMessage =
        el("scanMessage");

    const liveDot =
        el("liveDot");


    if (liveStatus) {

        liveStatus.textContent =
            "STARTING SCAN";

    }


    if (scanMessage) {

        scanMessage.textContent =
            "Mengirim perintah ke GitHub Actions...";

    }


    if (liveDot) {

        liveDot.classList.add(
            "active"
        );

    }

}


function setLiveRunning() {

    const liveStatus =
        el("liveStatus");

    const scanMessage =
        el("scanMessage");

    const liveDot =
        el("liveDot");


    if (liveStatus) {

        liveStatus.textContent =
            "LIVE SCAN";

    }


    if (scanMessage) {

        scanMessage.textContent =
            "Scanner sedang menjalankan proses...";

    }


    if (liveDot) {

        liveDot.classList.add(
            "active"
        );

    }

}


function setLiveReady() {

    const liveStatus =
        el("liveStatus");

    const scanMessage =
        el("scanMessage");

    const liveDot =
        el("liveDot");


    if (liveStatus) {

        liveStatus.textContent =
            "READY";

    }


    if (scanMessage) {

        scanMessage.textContent =
            "Scanner siap digunakan";

    }


    if (liveDot) {

        liveDot.classList.remove(
            "active"
        );

    }

}


function setLiveFailed() {

    const liveStatus =
        el("liveStatus");

    const scanMessage =
        el("scanMessage");

    const liveDot =
        el("liveDot");


    if (liveStatus) {

        liveStatus.textContent =
            "SCAN FAILED";

    }


    if (scanMessage) {

        scanMessage.textContent =
            "Scanner gagal menjalankan proses.";

    }


    if (liveDot) {

        liveDot.classList.remove(
            "active"
        );

    }

}


// =========================================================
// BUTTON STATE
// =========================================================

function setButtonRunning(running) {

    const button =
        el("scanButton");


    if (!button) {
        return;
    }


    if (running) {

        button.disabled =
            true;

        button.textContent =
            "⏳ SCAN BERJALAN...";

    }
    else {

        button.disabled =
            false;

        button.textContent =
            "🚀 SCAN SEKARANG";

    }

}


// =========================================================
// START SCAN
// =========================================================

async function startScan() {

    console.log(
        "START SCAN DIPANGGIL"
    );


    if (scanRunning) {

        alert(
            "Scan masih berjalan."
        );

        return;

    }


    // -----------------------------------------
    // CHECK TOKEN
    // -----------------------------------------

    if (
        !tokenIsConfigured()
    ) {

        alert(
            "Token GitHub belum diisi di app.js."
        );

        return;

    }


    scanRunning =
        true;

    setButtonRunning(
        true
    );

    setLiveStarting();


    try {

        // -------------------------------------
        // Ambil status sebelum scan
        // -------------------------------------

        const oldStatus =
            await loadJson(
                STATUS_URL
            );


        const oldStartedAt =
            oldStatus.started_at ||
            null;


        const oldFinishedAt =
            oldStatus.finished_at ||
            null;


        // -------------------------------------
        // Jika memang sedang running
        // -------------------------------------

        if (
            String(
                oldStatus.status || ""
            ).toLowerCase()
            === "running"
        ) {

            alert(
                "Scanner sedang berjalan. Tunggu sampai selesai."
            );

            return;

        }


        // -------------------------------------
        // POST GitHub API
        // -------------------------------------

        const response =
            await fetch(
                GITHUB_DISPATCH_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Accept":
                            "application/vnd.github+json",

                        "Authorization":
                            `Bearer ${GITHUB_TOKEN}`,

                        "Content-Type":
                            "application/json",

                        "X-GitHub-Api-Version":
                            "2022-11-28"

                    },

                    body:
                        JSON.stringify({

                            ref:
                                GITHUB_BRANCH

                        })

                }
            );


        // GitHub Actions dispatch
        // sukses = HTTP 204

        if (
            response.status !== 204
        ) {

            let message =
                `HTTP ${response.status}`;


            try {

                const errorData =
                    await response.json();

                if (
                    errorData.message
                ) {

                    message +=
                        ` - ${errorData.message}`;

                }

            }
            catch (e) {
                // Tidak ada JSON error
            }


            throw new Error(
                message
            );

        }


        console.log(
            "GitHub Actions berhasil dipanggil."
        );


        setLiveStarting();


        // -------------------------------------
        // Tunggu workflow benar-benar running
        // -------------------------------------

        await waitForScanStart(
            oldStartedAt,
            oldFinishedAt
        );


        // -------------------------------------
        // Tunggu sampai selesai
        // -------------------------------------

        await waitForScanFinish();


        // -------------------------------------
        // Load hasil terbaru
        // -------------------------------------

        await loadResults();


        await loadStatus();


    }
    catch (error) {

        console.error(
            "START SCAN ERROR:",
            error
        );


        setLiveFailed();


        alert(
            "Gagal menjalankan scanner.\n\n" +
            error.message
        );

    }
    finally {

        scanRunning =
            false;

        setButtonRunning(
            false
        );

    }

}


// =========================================================
// WAIT SCAN START
// =========================================================

async function waitForScanStart(
    oldStartedAt,
    oldFinishedAt
) {

    const timeout =
        90000;

    const start =
        Date.now();


    while (
        Date.now() - start
        < timeout
    ) {

        const status =
            await loadJson(
                STATUS_URL
            );


        const currentStatus =
            String(
                status.status || ""
            ).toLowerCase();


        const currentStartedAt =
            status.started_at ||
            null;


        // Workflow baru sudah mulai

        if (
            currentStatus === "running"
            &&
            currentStartedAt
            &&
            currentStartedAt !==
                oldStartedAt
        ) {

            updateStatus(
                status
            );

            return;

        }


        // Kalau file status belum berubah
        setLiveStarting();


        await sleep(
            3000
        );

    }


    throw new Error(
        "GitHub Actions belum terlihat mulai setelah 90 detik."
    );

}


// =========================================================
// WAIT SCAN FINISH
// =========================================================

async function waitForScanFinish() {

    const timeout =
        12 * 60 * 1000;

    const start =
        Date.now();


    while (
        Date.now() - start
        < timeout
    ) {

        const status =
            await loadJson(
                STATUS_URL
            );


        const currentStatus =
            String(
                status.status || ""
            ).toLowerCase();


        updateStatus(
            status
        );


        if (
            currentStatus ===
                "success"
        ) {

            return;

        }


        if (
            currentStatus ===
                "failed"
        ) {

            throw new Error(
                "GitHub Actions menjalankan scanner tetapi hasil akhirnya FAILED."
            );

        }


        setLiveRunning();


        await sleep(
            3000
        );

    }


    throw new Error(
        "Timeout. Scanner belum selesai setelah 12 menit."
    );

}


// =========================================================
// SLEEP
// =========================================================

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


// =========================================================
// REFRESH ALL
// =========================================================

async function refreshAll() {

    console.log(
        "REFRESH"
    );


    await loadStatus();

    await loadResults();

}


// =========================================================
// INITIAL LOAD
// =========================================================

async function init() {

    console.log(
        "SMC OB Scanner START"
    );


    try {

        await loadStatus();

        await loadResults();

    }
    catch (error) {

        console.error(
            "INIT ERROR:",
            error
        );

    }

}


// =========================================================
// AUTO REFRESH STATUS
// =========================================================

setInterval(
    async function () {

        if (
            !scanRunning
        ) {

            await loadStatus();

        }

    },
    10000
);


// =========================================================
// AUTO REFRESH RESULTS
// =========================================================

setInterval(
    async function () {

        if (
            !scanRunning
        ) {

            await loadResults();

        }

    },
    30000
);


// =========================================================
// START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    init
);

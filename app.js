// =========================================================
// SMC OB SCANNER - FRONTEND
// AUTO UPDATE + MANUAL REFRESH
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const RESULTS_URL = "results.json";
const STATUS_URL = "scan_status.json";

// Cek otomatis setiap 30 detik
const AUTO_REFRESH_INTERVAL = 30 * 1000;


// =========================================================
// INIT
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

    // Tombol Scan Now sudah tidak digunakan
    const scanButton = document.getElementById("scanButton");

    if (scanButton) {
        scanButton.style.display = "none";
    }


    // Load pertama kali
    refreshAll();


    // =====================================================
    // AUTO UPDATE
    // =====================================================
    //
    // Setiap 30 detik website akan mengecek:
    //
    // scan_status.json
    // results.json
    //
    // Jika ada hasil scan baru,
    // tampilan otomatis diperbarui.
    //

    setInterval(() => {

        refreshAll();

    }, AUTO_REFRESH_INTERVAL);

});


// =========================================================
// REFRESH ALL
// =========================================================

async function refreshAll() {

    try {

        await loadStatus();

        await loadResults();

    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

        setStatus(
            "offline",
            "Gagal mengambil data"
        );

    }

}


// =========================================================
// LOAD STATUS
// =========================================================

async function loadStatus() {

    const url =
        STATUS_URL +
        "?t=" +
        Date.now();

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Status HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    updateStatusUI(data);

}


// =========================================================
// UPDATE STATUS UI
// =========================================================

function updateStatusUI(data) {

    const status =
        data.status || "unknown";


    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------

    if (status === "running") {

        setStatus(
            "running",
            "Scanner sedang berjalan..."
        );

    }

    else if (status === "success") {

        setStatus(
            "online",
            "Scanner aktif"
        );

    }

    else if (status === "failed") {

        setStatus(
            "error",
            "Scan terakhir gagal"
        );

    }

    else {

        setStatus(
            "offline",
            "Status tidak diketahui"
        );

    }


    // -----------------------------------------------------
    // LAST SCAN
    // -----------------------------------------------------

    const finishedAt =
        data.finished_at ||
        data.generated_at ||
        "-";


    setText(
        "lastScan",
        finishedAt
    );


    // -----------------------------------------------------
    // PROGRESS
    // -----------------------------------------------------

    const processed =
        Number(
            data.processed || 0
        );

    const total =
        Number(
            data.total_tickers || 0
        );


    let progress = 0;

    if (total > 0) {

        progress =
            Math.round(
                (processed / total) * 100
            );

    }


    setText(
        "scanProgress",
        total > 0
            ? `${processed} / ${total}`
            : "-"
    );


    // Progress bar
    const progressFill =
        document.getElementById(
            "progressFill"
        );


    if (progressFill) {

        progressFill.style.width =
            progress + "%";

    }


    // -----------------------------------------------------
    // DURATION
    // -----------------------------------------------------

    const duration =
        data.duration_text || "-";


    setText(
        "scanDuration",
        duration
    );


    // -----------------------------------------------------
    // ERRORS
    // -----------------------------------------------------

    setText(
        "scanErrors",
        data.errors ?? 0
    );

}


// =========================================================
// LOAD RESULTS
// =========================================================

async function loadResults() {

    const url =
        RESULTS_URL +
        "?t=" +
        Date.now();


    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "Results HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    renderResults(data);

}


// =========================================================
// RENDER RESULTS
// =========================================================

function renderResults(data) {

    // -----------------------------------------------------
    // TOTAL TICKERS
    // -----------------------------------------------------

    setText(
        "totalTickers",
        formatNumber(
            data.total_tickers
        )
    );


    // -----------------------------------------------------
    // CANDIDATE COUNT
    // -----------------------------------------------------

    setText(
        "candidateCount",
        formatNumber(
            data.candidates
        )
    );


    // -----------------------------------------------------
    // GENERATED AT
    // -----------------------------------------------------

    setText(
        "generatedAt",
        data.generated_at || "-"
    );


    // -----------------------------------------------------
    // TABLE
    // -----------------------------------------------------

    const tbody =
        document.getElementById(
            "resultBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const rows =
        Array.isArray(data.data)
            ? data.data
            : [];


    // Tidak ada kandidat
    if (rows.length === 0) {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `
            <td colspan="100%">
                Tidak ada kandidat
            </td>
        `;


        tbody.appendChild(tr);

        return;

    }


    // -----------------------------------------------------
    // RENDER ROW
    // -----------------------------------------------------

    rows.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${safe(row.ticker)}
            </td>

            <td>
                ${safe(row.ob_range)}
            </td>

            <td>
                ${formatNumber(row.sl)}
            </td>

            <td>
                ${formatPercent(row.sl_pct)}
            </td>

            <td>
                ${formatNumber(row.tp)}
            </td>

            <td>
                ${formatPercent(row.tp_pct)}
            </td>

            <td>
                ${safe(row.rr)}
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
                ${safe(row.score)}
            </td>

        `;


        tbody.appendChild(tr);

    });

}


// =========================================================
// STATUS
// =========================================================

function setStatus(
    type,
    text
) {

    const statusText =
        document.getElementById(
            "statusText"
        );


    const statusDot =
        document.getElementById(
            "statusDot"
        );


    if (statusText) {

        statusText.textContent =
            text;

    }


    if (statusDot) {

        statusDot.className =
            "status-dot " +
            type;

    }

}


// =========================================================
// SET TEXT
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

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
        "id-ID"
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


    return number.toLocaleString(
        "id-ID",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ) + "%";

}


// =========================================================
// SAFE HTML
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

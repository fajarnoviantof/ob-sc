// ==========================================================
// KONFIGURASI
// ==========================================================

const RESULTS_URL = "results.json";

const STATUS_URL = "scan_status.json";

const WORKER_URL =
    "https://flat-firefly-50c7smc-ob-trigger.fajarnoviantov.workers.dev/";


// ==========================================================
// LOAD HASIL SCANNER
// ==========================================================

async function loadResults() {

    try {

        const response = await fetch(
            RESULTS_URL + "?t=" + Date.now()
        );

        if (!response.ok) {
            throw new Error(
                "Gagal membaca results.json"
            );
        }

        const result = await response.json();

        const totalTickers =
            document.getElementById("totalTickers");

        const candidateCount =
            document.getElementById("candidateCount");

        const generatedAt =
            document.getElementById("generatedAt");

        const lastScan =
            document.getElementById("lastScan");

        const scanProgress =
            document.getElementById("scanProgress");

        const scanDuration =
            document.getElementById("scanDuration");

        const scanErrors =
            document.getElementById("scanErrors");

        const progressFill =
            document.getElementById("progressFill");


        if (totalTickers) {
            totalTickers.textContent =
                result.total_tickers ?? "-";
        }

        if (candidateCount) {
            candidateCount.textContent =
                result.candidates ?? "-";
        }

        if (generatedAt) {
            generatedAt.textContent =
                formatDateTime(
                    result.generated_at
                );
        }

        if (lastScan) {
            lastScan.textContent =
                formatDateTime(
                    result.finished_at ||
                    result.generated_at
                );
        }

        if (scanProgress) {

            scanProgress.textContent =
                String(
                    result.processed ??
                    result.total_tickers ??
                    0
                ) +
                " / " +
                String(
                    result.total_tickers ??
                    0
                );

        }

        if (scanDuration) {

            scanDuration.textContent =
                result.duration_text ??
                "-";

        }

        if (scanErrors) {

            scanErrors.textContent =
                result.errors ??
                0;

        }


        const total =
            Number(
                result.total_tickers
            ) || 0;

        const processed =
            Number(
                result.processed
            ) || 0;

        let percent = 0;

        if (total > 0) {

            percent =
                (processed / total) * 100;

        }

        if (progressFill) {

            progressFill.style.width =
                Math.min(
                    percent,
                    100
                ) + "%";

        }


        renderTable(
            result.data || []
        );


    } catch (error) {

        console.error(
            "loadResults:",
            error
        );

    }

}


// ==========================================================
// LOAD STATUS SCANNER
// ==========================================================

async function loadScanStatus() {

    try {

        const response = await fetch(
            STATUS_URL + "?t=" + Date.now()
        );

        if (!response.ok) {

            throw new Error(
                "Gagal membaca scan_status.json"
            );

        }

        const status =
            await response.json();

        updateScannerStatus(
            status
        );


    } catch (error) {

        console.error(
            "loadScanStatus:",
            error
        );

    }

}


// ==========================================================
// UPDATE STATUS WEBSITE
// ==========================================================

function updateScannerStatus(
    status
) {

    const liveDot =
        document.getElementById(
            "liveDot"
        );

    const liveStatus =
        document.getElementById(
            "liveStatus"
        );

    const message =
        document.getElementById(
            "scanMessage"
        );

    const scanButton =
        document.getElementById(
            "scanButton"
        );

    const statusText =
        document.getElementById(
            "statusText"
        );

    const statusDot =
        document.getElementById(
            "statusDot"
        );


    if (
        status.status ===
        "running"
    ) {

        if (liveDot) {
            liveDot.classList.add(
                "running"
            );
        }

        if (liveStatus) {
            liveStatus.textContent =
                "SCANNER RUNNING";
        }

        if (message) {
            message.textContent =
                "Sedang memproses data Yahoo Finance...";
        }

        if (scanButton) {

            scanButton.disabled =
                true;

            scanButton.textContent =
                "⏳ SCAN BERJALAN";

        }

        if (statusText) {
            statusText.textContent =
                "Scanning...";
        }

        if (statusDot) {
            statusDot.classList.add(
                "running"
            );
        }

        return;
    }


    if (
        status.status ===
        "failed"
    ) {

        if (liveDot) {
            liveDot.classList.remove(
                "running"
            );
        }

        if (liveStatus) {
            liveStatus.textContent =
                "SCAN FAILED";
        }

        if (message) {
            message.textContent =
                "Scanner mengalami kesalahan.";
        }

        if (scanButton) {

            scanButton.disabled =
                false;

            scanButton.textContent =
                "🚀 SCAN SEKARANG";

        }

        if (statusText) {
            statusText.textContent =
                "Scan gagal";
        }

        if (statusDot) {
            statusDot.classList.remove(
                "running"
            );
        }

        return;
    }


    if (liveDot) {
        liveDot.classList.remove(
            "running"
        );
    }

    if (liveStatus) {
        liveStatus.textContent =
            "LIVE SCAN";
    }

    if (message) {
        message.textContent =
            "Scanner siap digunakan";
    }

    if (scanButton) {

        scanButton.disabled =
            false;

        scanButton.textContent =
            "🚀 SCAN SEKARANG";

    }

    if (statusText) {
        statusText.textContent =
            "Data terbaru";
    }

    if (statusDot) {
        statusDot.classList.remove(
            "running"
        );
    }

}


// ==========================================================
// TEST KONEKSI WORKER
// ==========================================================

async function testWorkerConnection() {

    console.log(
        "======================================"
    );

    console.log(
        "TEST CLOUDFLARE WORKER"
    );

    console.log(
        "Worker URL:",
        WORKER_URL
    );

    console.log(
        "======================================"
    );


    try {

        const response =
            await fetch(
                WORKER_URL,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        console.log(
            "Worker HTTP status:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "Worker response:",
            text
        );


        return true;


    } catch (error) {

        console.error(
            "TEST WORKER GAGAL:",
            error
        );

        return false;

    }

}


// ==========================================================
// TOMBOL SCAN SEKARANG
// ==========================================================

async function startScan() {

    console.log(
        "======================================"
    );

    console.log(
        "START SCAN DIPANGGIL"
    );

    console.log(
        "Worker:",
        WORKER_URL
    );

    console.log(
        "======================================"
    );


    const scanButton =
        document.getElementById(
            "scanButton"
        );

    const liveStatus =
        document.getElementById(
            "liveStatus"
        );

    const message =
        document.getElementById(
            "scanMessage"
        );

    const liveDot =
        document.getElementById(
            "liveDot"
        );

    const statusText =
        document.getElementById(
            "statusText"
        );

    const statusDot =
        document.getElementById(
            "statusDot"
        );


    if (
        scanButton &&
        scanButton.disabled
    ) {

        return;

    }


    if (scanButton) {

        scanButton.disabled =
            true;

        scanButton.textContent =
            "⏳ MEMULAI SCAN...";

    }


    if (liveDot) {
        liveDot.classList.add(
            "running"
        );
    }

    if (liveStatus) {
        liveStatus.textContent =
            "MEMULAI SCAN";
    }

    if (message) {
        message.textContent =
            "Menghubungkan ke scanner...";
    }

    if (statusText) {
        statusText.textContent =
            "Connecting...";
    }

    if (statusDot) {
        statusDot.classList.add(
            "running"
        );
    }


    try {

        console.log(
            "Mengirim POST ke Worker..."
        );


        const response =
            await fetch(
                WORKER_URL,
                {
                    method: "POST",
                    mode: "cors",
                    cache: "no-store"
                }
            );


        console.log(
            "Response Worker:",
            response
        );

        console.log(
            "HTTP status:",
            response.status
        );


        let result = null;


        try {

            result =
                await response.json();

        } catch (jsonError) {

            console.error(
                "Response bukan JSON:",
                jsonError
            );

        }


        console.log(
            "Data Worker:",
            result
        );


        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        if (
            !result ||
            !result.success
        ) {

            throw new Error(
                (
                    result &&
                    result.message
                ) ||
                "Worker tidak mengonfirmasi scanner."
            );

        }


        console.log(
            "======================================"
        );

        console.log(
            "SCANNER BERHASIL DIMULAI"
        );

        console.log(
            "======================================"
        );


        if (liveStatus) {
            liveStatus.textContent =
                "SCANNER RUNNING";
        }

        if (message) {
            message.textContent =
                "Scanner sedang memproses data Yahoo Finance...";
        }

        if (scanButton) {
            scanButton.textContent =
                "⏳ SCAN BERJALAN";
        }

        if (statusText) {
            statusText.textContent =
                "Scanning...";
        }


        await loadScanStatus();

        await loadResults();


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "START SCAN GAGAL"
        );

        console.error(
            error
        );

        console.error(
            "======================================"
        );


        if (liveDot) {
            liveDot.classList.remove(
                "running"
            );
        }

        if (statusDot) {
            statusDot.classList.remove(
                "running"
            );
        }

        if (liveStatus) {
            liveStatus.textContent =
                "SCAN ERROR";
        }

        if (message) {
            message.textContent =
                "Gagal menjalankan scanner.";
        }

        if (statusText) {
            statusText.textContent =
                "Error";
        }

        if (scanButton) {

            scanButton.disabled =
                false;

            scanButton.textContent =
                "🚀 SCAN SEKARANG";

        }


        alert(
            "Gagal menjalankan scanner.\n\n" +
            error.message
        );

    }

}


// ==========================================================
// RENDER TABLE
// ==========================================================

function renderTable(
    data
) {

    const body =
        document.getElementById(
            "resultBody"
        );


    if (!body) {
        return;
    }


    if (
        !data.length
    ) {

        body.innerHTML =
            "<tr>" +
            "<td colspan=\"10\" class=\"empty\">" +
            "Tidak ada kandidat " +
            "yang memenuhi filter." +
            "</td>" +
            "</tr>";

        return;

    }


    body.innerHTML =
        data.map(
            function(item, index) {

                return (
                    "<tr>" +

                    "<td>" +
                    (index + 1) +
                    "</td>" +

                    "<td class=\"ticker\">" +
                    (item.ticker ?? "-") +
                    "</td>" +

                    "<td>" +
                    (item.ob_range ?? "-") +
                    "</td>" +

                    "<td>" +
                    (item.sl ?? "-") +
                    " <small>(" +
                    (item.sl_pct ?? "-") +
                    "%)</small>" +
                    "</td>" +

                    "<td>" +
                    (item.tp ?? "-") +
                    " <small>(" +
                    (item.tp_pct ?? "-") +
                    "%)</small>" +
                    "</td>" +

                    "<td class=\"rr\">" +
                    "1:" +
                    Number(
                        item.rr ?? 0
                    ).toFixed(1) +
                    "</td>" +

                    "<td>" +
                    Number(
                        item.distance ?? 0
                    ).toFixed(2) +
                    "%" +
                    "</td>" +

                    "<td>" +
                    (item.bos_age ?? "-") +
                    "</td>" +

                    "<td>" +
                    Number(
                        item.ob_size ?? 0
                    ).toFixed(2) +
                    "%" +
                    "</td>" +

                    "<td class=\"score\">" +
                    Number(
                        item.score ?? 0
                    ).toFixed(2) +
                    "</td>" +

                    "</tr>"
                );

            }
        ).join("");

}


// ==========================================================
// FORMAT TANGGAL
// ==========================================================

function formatDateTime(
    value
) {

    if (!value) {
        return "-";
    }


    if (
        String(value).includes(
            "WIB"
        )
    ) {

        return value;

    }


    const date =
        new Date(
            String(value).replace(
                " ",
                "T"
            ) +
            "+07:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const year =
        date.getFullYear();

    const hour =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );

    const minute =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );

    const second =
        String(
            date.getSeconds()
        ).padStart(
            2,
            "0"
        );


    return (
        day +
        "-" +
        month +
        "-" +
        year +
        " " +
        hour +
        ":" +
        minute +
        ":" +
        second +
        " WIB"
    );

}


// ==========================================================
// REFRESH
// ==========================================================

function refreshAll() {

    loadResults();

    loadScanStatus();

}


// ==========================================================
// LOAD AWAL
// ==========================================================

loadResults();

loadScanStatus();


// ==========================================================
// AUTO REFRESH
// ==========================================================

setInterval(
    loadResults,
    10 * 1000
);

setInterval(
    loadScanStatus,
    5 * 1000
);

// ==========================================================
// KONFIGURASI
// ==========================================================

const RESULTS_URL = "results.json";

const STATUS_URL = "scan_status.json";

const WORKER_URL =
    "https://flat-firefly-50c7smc-ob-trigger.fajarnoviantov.workers.dev/";


// ==========================================================
// STATE
// ==========================================================

let scanStarting = false;

let lastKnownStatus = null;


// ==========================================================
// LOAD HASIL SCANNER
// ==========================================================

async function loadResults() {

    try {

        const response = await fetch(
            RESULTS_URL + "?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Gagal membaca results.json"
            );
        }

        const result =
            await response.json();


        const totalTickers =
            document.getElementById(
                "totalTickers"
            );

        const candidateCount =
            document.getElementById(
                "candidateCount"
            );

        const generatedAt =
            document.getElementById(
                "generatedAt"
            );

        const lastScan =
            document.getElementById(
                "lastScan"
            );

        const scanProgress =
            document.getElementById(
                "scanProgress"
            );

        const scanDuration =
            document.getElementById(
                "scanDuration"
            );

        const scanErrors =
            document.getElementById(
                "scanErrors"
            );

        const progressFill =
            document.getElementById(
                "progressFill"
            );


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

            const total =
                result.total_tickers ?? 0;

            const processed =
                result.processed ?? 0;

            scanProgress.textContent =
                processed +
                " / " +
                total;

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
                (
                    processed /
                    total
                ) * 100;

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
// LOAD STATUS
// ==========================================================

async function loadScanStatus() {

    try {

        const response = await fetch(
            STATUS_URL + "?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                "Gagal membaca scan_status.json"
            );

        }


        const status =
            await response.json();


        lastKnownStatus =
            status.status;


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


    // ======================================================
    // RUNNING
    // ======================================================

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


    // ======================================================
    // FAILED
    // ======================================================

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


    // ======================================================
    // SUCCESS / IDLE
    // ======================================================

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
// TOMBOL SCAN
// ==========================================================

async function startScan() {

    if (scanStarting) {

        return;

    }


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


    // ======================================================
    // CEK STATUS TERLEBIH DAHULU
    // ======================================================

    await loadScanStatus();


    if (
        lastKnownStatus ===
        "running"
    ) {

        alert(
            "Scanner sedang berjalan.\n\n" +
            "Tunggu sampai scan selesai."
        );

        return;

    }


    // ======================================================
    // STATE STARTING
    // ======================================================

    scanStarting =
        true;


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
            "======================================"
        );

        console.log(
            "START SCAN"
        );

        console.log(
            "Worker:",
            WORKER_URL
        );

        console.log(
            "======================================"
        );


        // ==================================================
        // PANGGIL CLOUDFLARE WORKER
        // ==================================================

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
            "Worker HTTP:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "Worker response:",
            text
        );


        let result;


        try {

            result =
                JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Response Worker bukan JSON."
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                (
                    "Worker HTTP " +
                    response.status
                )
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result.message ||
                "Worker tidak berhasil menjalankan scanner."
            );

        }


        // ==================================================
        // WORKER BERHASIL
        // ==================================================

        console.log(
            "Scanner berhasil dipicu."
        );


        if (liveStatus) {

            liveStatus.textContent =
                "MENUNGGU GITHUB ACTIONS";

        }


        if (message) {

            message.textContent =
                "GitHub Actions sedang memulai scanner...";

        }


        // ==================================================
        // TUNGGU STATUS RUNNING
        // ==================================================

        let runningDetected =
            false;


        for (
            let i = 0;
            i < 12;
            i++
        ) {

            await delay(
                2000
            );

            await loadScanStatus();


            if (
                lastKnownStatus ===
                "running"
            ) {

                runningDetected =
                    true;

                break;

            }

        }


        // ==================================================
        // RUNNING TERDETEKSI
        // ==================================================

        if (runningDetected) {

            if (liveStatus) {

                liveStatus.textContent =
                    "SCANNER RUNNING";

            }


            if (message) {

                message.textContent =
                    "Sedang memproses data Yahoo Finance...";

            }


            console.log(
                "Status RUNNING terdeteksi."
            );

        } else {

            if (liveStatus) {

                liveStatus.textContent =
                    "SCAN DIMULAI";

            }


            if (message) {

                message.textContent =
                    "Scanner sudah dipicu. Menunggu hasil...";

            }

        }


        // ==================================================
        // REFRESH HASIL
        // ==================================================

        await loadResults();


    } catch (error) {

        console.error(
            "START SCAN GAGAL:",
            error
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


    } finally {

        scanStarting =
            false;

    }

}


// ==========================================================
// DELAY
// ==========================================================

function delay(
    milliseconds
) {

    return new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );

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
// AUTO REFRESH HASIL
// ==========================================================

setInterval(
    loadResults,
    10000
);


// ==========================================================
// AUTO REFRESH STATUS
// ==========================================================

setInterval(
    loadScanStatus,
    3000
);

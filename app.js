// ==========================================================
// KONFIGURASI
// ==========================================================

const RESULTS_URL =
    "results.json";

const STATUS_URL =
    "scan_status.json";

const ACTION_URL =
    "https://github.com/fajarnoviantof/ob-sc/actions/workflows/scanner.yml";


// ==========================================================
// LOAD HASIL SCANNER
// ==========================================================

async function loadResults() {

    try {

        const response =
            await fetch(
                RESULTS_URL +
                "?t=" +
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Gagal membaca results.json"
            );

        }


        const result =
            await response.json();


        // ------------------------------------------
        // SUMMARY
        // ------------------------------------------

        document.getElementById(
            "totalTickers"
        ).textContent =
            result.total_tickers ?? "-";


        document.getElementById(
            "candidateCount"
        ).textContent =
            result.candidates ?? "-";


        document.getElementById(
            "generatedAt"
        ).textContent =
            formatDateTime(
                result.generated_at
            );


        // ------------------------------------------
        // INFO SCAN
        // ------------------------------------------

        document.getElementById(
            "lastScan"
        ).textContent =
            formatDateTime(
                result.finished_at ||
                result.generated_at
            );


        document.getElementById(
            "scanProgress"
        ).textContent =
            `${result.processed ?? result.total_tickers ?? 0} / ${result.total_tickers ?? 0}`;


        document.getElementById(
            "scanDuration"
        ).textContent =
            result.duration_text ??
            "-";


        document.getElementById(
            "scanErrors"
        ).textContent =
            result.errors ??
            0;


        // ------------------------------------------
        // PROGRESS BAR
        // ------------------------------------------

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


        document.getElementById(
            "progressFill"
        ).style.width =
            Math.min(
                percent,
                100
            ) + "%";


        // ------------------------------------------
        // TABLE
        // ------------------------------------------

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

        const response =
            await fetch(
                STATUS_URL +
                "?t=" +
                Date.now()
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


    // ==========================================
    // RUNNING
    // ==========================================

    if (
        status.status ===
        "running"
    ) {

        liveDot.classList.add(
            "running"
        );


        liveStatus.textContent =
            "SCANNER RUNNING";


        message.textContent =
            "Sedang memproses data Yahoo Finance...";


        scanButton.disabled =
            true;


        scanButton.textContent =
            "⏳ SCAN BERJALAN";


        statusText.textContent =
            "Scanning...";


        statusDot.classList.add(
            "running"
        );


        return;

    }


    // ==========================================
    // FAILED
    // ==========================================

    if (
        status.status ===
        "failed"
    ) {

        liveDot.classList.remove(
            "running"
        );


        liveStatus.textContent =
            "SCAN FAILED";


        message.textContent =
            "Scanner mengalami kesalahan.";


        scanButton.disabled =
            false;


        scanButton.textContent =
            "🚀 SCAN SEKARANG";


        statusText.textContent =
            "Scan gagal";


        statusDot.classList.remove(
            "running"
        );


        return;

    }


    // ==========================================
    // SUCCESS / READY
    // ==========================================

    liveDot.classList.remove(
        "running"
    );


    liveStatus.textContent =
        "LIVE SCAN";


    message.textContent =
        "Scanner siap digunakan";


    scanButton.disabled =
        false;


    scanButton.textContent =
        "🚀 SCAN SEKARANG";


    statusText.textContent =
        "Data terbaru";


    statusDot.classList.remove(
        "running"
    );

}


// ==========================================================
// TOMBOL SCAN SEKARANG
// ==========================================================

function startScan() {

    const confirmScan =
        confirm(
            "Buka GitHub Actions untuk menjalankan scan sekarang?"
        );


    if (!confirmScan) {

        return;

    }


    window.open(
        ACTION_URL,
        "_blank"
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


    if (!data.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty"
                >
                    Tidak ada kandidat
                    yang memenuhi filter.
                </td>

            </tr>

        `;

        return;

    }


    body.innerHTML =
        data.map(
            (item, index) => `

            <tr>

                <td>
                    ${index + 1}
                </td>


                <td class="ticker">
                    ${item.ticker ?? "-"}
                </td>


                <td>
                    ${item.ob_range ?? "-"}
                </td>


                <td>

                    ${item.sl ?? "-"}

                    <small>
                        (${item.sl_pct ?? "-"}%)
                    </small>

                </td>


                <td>

                    ${item.tp ?? "-"}

                    <small>
                        (${item.tp_pct ?? "-"}%)
                    </small>

                </td>


                <td class="rr">

                    1:${Number(
                        item.rr ?? 0
                    ).toFixed(1)}

                </td>


                <td>

                    ${Number(
                        item.distance ?? 0
                    ).toFixed(2)}%

                </td>


                <td>

                    ${item.bos_age ?? "-"}

                </td>


                <td>

                    ${Number(
                        item.ob_size ?? 0
                    ).toFixed(2)}%

                </td>


                <td class="score">

                    ${Number(
                        item.score ?? 0
                    ).toFixed(2)}

                </td>

            </tr>

        `
        )
        .join("");

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


    // Jika sudah mengandung WIB
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
        `${day}-${month}-${year} ` +
        `${hour}:${minute}:${second} WIB`
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

// Hasil scanner
setInterval(
    loadResults,
    15 * 1000
);


// Status scanner
setInterval(
    loadScanStatus,
    10 * 1000
);

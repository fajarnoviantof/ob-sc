let scanRunning = false;


/* =====================================================
   FORMAT TANGGAL
===================================================== */

function formatDate(value) {

    if (!value) {
        return "-";
    }

    return value + " WIB";

}


/* =====================================================
   LOAD RESULTS
===================================================== */

async function loadResults() {

    const body =
        document.getElementById(
            "resultBody"
        );


    try {

        const response =
            await fetch(
                "results.json?t=" +
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Gagal membaca results.json"
            );

        }


        const result =
            await response.json();


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
            formatDate(
                result.generated_at
            );


        document.getElementById(
            "lastScan"
        ).textContent =
            formatDate(
                result.generated_at
            );


        document.getElementById(
            "scanProgress"
        ).textContent =

            `${result.processed ?? result.total_tickers ?? 0} / ${result.total_tickers ?? 0}`;


        document.getElementById(
            "scanDuration"
        ).textContent =
            result.duration_text ?? "-";


        document.getElementById(
            "scanErrors"
        ).textContent =
            result.errors ?? 0;


        renderTable(
            result.data || []
        );


    } catch (error) {

        console.error(error);

        body.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty"
                >
                    Gagal memuat hasil scanner.
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   LOAD SCAN STATUS
===================================================== */

async function loadScanStatus() {

    try {

        const response =
            await fetch(
                "scan_status.json?t=" +
                Date.now()
            );


        if (!response.ok) {
            return;
        }


        const status =
            await response.json();


        const liveStatus =
            document.getElementById(
                "liveStatus"
            );


        const scanMessage =
            document.getElementById(
                "scanMessage"
            );


        const liveDot =
            document.getElementById(
                "liveDot"
            );


        const statusDot =
            document.getElementById(
                "statusDot"
            );


        const statusText =
            document.getElementById(
                "statusText"
            );


        const scanButton =
            document.getElementById(
                "scanButton"
            );


        if (
            status.status ===
            "running"
        ) {

            scanRunning = true;


            liveStatus.textContent =
                "SCANNER RUNNING";


            scanMessage.textContent =
                "Sedang memproses data Yahoo Finance...";


            liveDot.classList.add(
                "running"
            );


            statusDot.classList.add(
                "running"
            );


            statusText.textContent =
                "Scanning...";


            scanButton.disabled =
                true;


            scanButton.textContent =
                "⏳ SCAN SEDANG BERJALAN";


        } else {

            scanRunning = false;


            liveStatus.textContent =
                "LIVE SCAN";


            scanMessage.textContent =
                "Scanner siap digunakan";


            liveDot.classList.remove(
                "running"
            );


            statusDot.classList.remove(
                "running"
            );


            statusText.textContent =
                "Data terbaru";


            scanButton.disabled =
                false;


            scanButton.textContent =
                "🚀 SCAN SEKARANG";

        }


    } catch (error) {

        console.error(
            "Status error:",
            error
        );

    }

}


/* =====================================================
   RENDER TABLE
===================================================== */

function renderTable(data) {

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
                    ${item.ticker}
                </td>


                <td>
                    ${item.ob_range}
                </td>


                <td>

                    ${item.sl}

                    <small>
                        (${item.sl_pct}%)
                    </small>

                </td>


                <td>

                    ${item.tp}

                    <small>
                        (${item.tp_pct}%)
                    </small>

                </td>


                <td class="rr">

                    1:${Number(
                        item.rr
                    ).toFixed(1)}

                </td>


                <td>

                    ${Number(
                        item.distance
                    ).toFixed(2)}%

                </td>


                <td>
                    ${item.bos_age}
                </td>


                <td>

                    ${Number(
                        item.ob_size
                    ).toFixed(2)}%

                </td>


                <td class="score">

                    ${Number(
                        item.score
                    ).toFixed(2)}

                </td>

            </tr>

        `
        )
        .join("");

}


/* =====================================================
   SCAN SEKARANG
===================================================== */

function startScan() {

    /*
       GitHub tidak mengizinkan workflow_dispatch
       tanpa autentikasi.

       Jadi tombol ini membuka halaman Actions.
       Tidak ada GitHub Token yang disimpan di website.
    */


    const url =
        "https://github.com";


    /*
       Ganti URL di bawah dengan URL repository Anda.

       Contoh:

       https://github.com/fajarxxx/smc-ob-scanner/actions

    */


    window.open(
        url,
        "_blank"
    );

}


/* =====================================================
   INITIAL LOAD
===================================================== */

loadResults();

loadScanStatus();


/* =====================================================
   AUTO REFRESH
===================================================== */

setInterval(
    loadResults,
    15 * 1000
);


setInterval(
    loadScanStatus,
    10 * 1000
);

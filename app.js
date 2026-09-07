// =========================================================
// SMC OB SCANNER
// FRONTEND ONLY
// =========================================================


// =========================================================
// FILE
// =========================================================

const RESULTS_URL =
    "results.json";

const STATUS_URL =
    "scan_status.json";


// =========================================================
// ELEMENT
// =========================================================

const scanButton =
    document.getElementById(
        "scanButton"
    );


// =========================================================
// INIT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Hilangkan tombol scan manual
        if (scanButton) {

            scanButton.style.display =
                "none";

        }


        refreshAll();

    }
);


// =========================================================
// REFRESH ALL
// =========================================================

async function refreshAll() {

    await loadStatus();

    await loadResults();

}


// =========================================================
// LOAD STATUS
// =========================================================

async function loadStatus() {

    try {

        const response =
            await fetch(
                STATUS_URL +
                "?t=" +
                Date.now()
            );


        if (!response.ok) {

            throw new Error(
                "Status HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        updateStatusUI(
            data
        );


    } catch (error) {

        console.error(
            "Gagal membaca status:",
            error
        );


        setStatus(
            "offline",
            "STATUS ERROR"
        );

    }

}


// =========================================================
// UPDATE STATUS UI
// =========================================================

function updateStatusUI(data) {

    if (!data) {

        return;

    }


    const status =
        String(
            data.status ||
            ""
        ).toLowerCase();


    if (status === "running") {

        setStatus(
            "running",
            "SCANNING..."
        );

    }

    else if (
        status === "success"
    ) {

        setStatus(
            "success",
            "SCAN SELESAI"
        );

    }

    else if (
        status === "failed"
    ) {

        setStatus(
            "error",
            "SCAN GAGAL"
        );

    }

    else {

        setStatus(
            "idle",
            "READY"
        );

    }


    // -----------------------------------------
    // LAST SCAN
    // -----------------------------------------

    setText(
        "lastScan",
        data.finished_at ||
        data.generated_at ||
        "-"
    );


    // -----------------------------------------
    // PROGRESS
    // -----------------------------------------

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
                (
                    processed /
                    total
                ) * 100
            );

    }


    setText(
        "scanProgress",
        total > 0
            ? `${processed} / ${total}`
            : "-"
    );


    const progressFill =
        document.getElementById(
            "progressFill"
        );


    if (progressFill) {

        progressFill.style.width =
            progress + "%";

    }


    // -----------------------------------------
    // DURATION
    // -----------------------------------------

    setText(
        "scanDuration",
        data.duration_text ||
        "-"
    );


    // -----------------------------------------
    // ERRORS
    // -----------------------------------------

    setText(
        "scanErrors",
        data.errors ??
        "-"
    );

}


// =========================================================
// LOAD RESULTS
// =========================================================

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
                "Results HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        renderResults(
            data
        );


    } catch (error) {

        console.error(
            "Gagal membaca results:",
            error
        );


        const body =
            document.getElementById(
                "resultBody"
            );


        if (body) {

            body.innerHTML = `
                <tr>
                    <td colspan="10">
                        Gagal membaca hasil scanner
                    </td>
                </tr>
            `;

        }

    }

}


// =========================================================
// RENDER RESULTS
// =========================================================

function renderResults(data) {

    if (!data) {

        return;

    }


    // -----------------------------------------
    // SUMMARY
    // -----------------------------------------

    setText(
        "totalTickers",
        data.total_tickers ??
        "-"
    );


    setText(
        "candidateCount",
        data.candidates ??
        0
    );


    setText(
        "generatedAt",
        data.generated_at ??
        "-"
    );


    // -----------------------------------------
    // TABLE
    // -----------------------------------------

    const body =
        document.getElementById(
            "resultBody"
        );


    if (!body) {

        return;

    }


    body.innerHTML = "";


    const rows =
        Array.isArray(
            data.data
        )
            ? data.data
            : [];


    if (rows.length === 0) {

        body.innerHTML = `
            <tr>
                <td colspan="10">
                    Tidak ada kandidat
                </td>
            </tr>
        `;

        return;

    }


    rows.forEach(
        row => {

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    ${safe(
                        row.ticker
                    )}
                </td>

                <td>
                    ${safe(
                        row.ob_range
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.sl
                    )}
                </td>

                <td>
                    ${formatPercent(
                        row.sl_pct
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.tp
                    )}
                </td>

                <td>
                    ${formatPercent(
                        row.tp_pct
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.rr
                    )}
                </td>

                <td>
                    ${formatPercent(
                        row.distance
                    )}
                </td>

                <td>
                    ${safe(
                        row.bos_age
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.ob_size
                    )}
                </td>

            `;


            body.appendChild(
                tr
            );

        }
    );

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
        document.getElementById(
            id
        );


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

        return safe(
            value
        );

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

        return safe(
            value
        );

    }


    return number.toLocaleString(
        "id-ID",
        {
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


    return String(
        value
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}

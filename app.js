// =========================================================
// MARKET SCANNER - FRONTEND
// SMC OB + MACD + 31-DAY HISTORY
// =========================================================


// =========================================================
// CONFIG
// =========================================================

const RESULTS_URL = "results.json";

const MACD_RESULTS_URL = "macd_results.json";

const STATUS_URL = "scan_status.json";

const HISTORY_URL = "history.json";

// Auto refresh setiap 30 detik
const AUTO_REFRESH_INTERVAL = 30 * 1000;


// =========================================================
// STATE
// =========================================================

let currentPage = "ob";

let historyFilter = "ALL";

let historyData = [];


// =========================================================
// INIT
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Load data pertama kali
        refreshAll();

        // Auto refresh setiap 30 detik
        setInterval(
            function () {

                refreshAll();

            },
            AUTO_REFRESH_INTERVAL
        );

    }
);


// =========================================================
// PAGE SWITCH
// =========================================================

function switchPage(page) {

    currentPage = page;


    // -----------------------------------------------------
    // SEMBUNYIKAN SEMUA PAGE
    // -----------------------------------------------------

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(
        function (element) {

            element.classList.remove(
                "active"
            );

        }
    );


    // -----------------------------------------------------
    // NONAKTIFKAN SEMUA TAB
    // -----------------------------------------------------

    const tabs =
        document.querySelectorAll(".nav-tab");


    tabs.forEach(
        function (element) {

            element.classList.remove(
                "active"
            );

        }
    );


    // -----------------------------------------------------
    // AKTIFKAN PAGE
    // -----------------------------------------------------

    const pageElement =
        document.getElementById(
            "page-" + page
        );


    if (pageElement) {

        pageElement.classList.add(
            "active"
        );

    }


    // -----------------------------------------------------
    // AKTIFKAN TAB
    // -----------------------------------------------------

    const tab =
        document.querySelector(
            '.nav-tab[data-page="' +
            page +
            '"]'
        );


    if (tab) {

        tab.classList.add(
            "active"
        );

    }


    // -----------------------------------------------------
    // RENDER HISTORY
    // -----------------------------------------------------

    if (page === "history") {

        renderHistory();

    }

}


// =========================================================
// REFRESH ALL
// =========================================================

async function refreshAll() {

    try {

        await Promise.all([
            loadStatus(),
            loadResults(),
            loadMacdResults(),
            loadHistory()
        ]);


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
// FETCH JSON
// =========================================================

async function fetchJson(
    baseUrl
) {

    const url =
        baseUrl +
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
            baseUrl +
            " HTTP " +
            response.status
        );

    }


    return await response.json();

}


// =========================================================
// LOAD STATUS
// =========================================================

async function loadStatus() {

    const data =
        await fetchJson(
            STATUS_URL
        );


    updateStatusUI(
        data
    );

}


// =========================================================
// UPDATE STATUS
// =========================================================

function updateStatusUI(
    data
) {

    const status =
        data.status ||
        "unknown";


    // -----------------------------------------------------
    // RUNNING
    // -----------------------------------------------------

    if (status === "running") {

        setStatus(
            "running",
            "Scanner sedang berjalan..."
        );

        return;

    }


    // -----------------------------------------------------
    // SUCCESS
    // -----------------------------------------------------

    if (status === "success") {

        setStatus(
            "online",
            "Scanner aktif"
        );

        return;

    }


    // -----------------------------------------------------
    // PARTIAL
    // -----------------------------------------------------

    if (status === "partial") {

        setStatus(
            "running",
            "Scanner selesai sebagian"
        );

        return;

    }


    // -----------------------------------------------------
    // FAILED
    // -----------------------------------------------------

    if (status === "failed") {

        setStatus(
            "error",
            "Scan terakhir gagal"
        );

        return;

    }


    // -----------------------------------------------------
    // UNKNOWN
    // -----------------------------------------------------

    setStatus(
        "offline",
        "Status tidak diketahui"
    );

}


// =========================================================
// LOAD SMC OB
// =========================================================

async function loadResults() {

    const data =
        await fetchJson(
            RESULTS_URL
        );


    renderOB(
        data
    );

}


// =========================================================
// RENDER SMC OB
// =========================================================

function renderOB(
    data
) {

    // -----------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------

    setText(
        "obCandidateCount",
        formatNumber(
            data.candidates
        )
    );


    setText(
        "obTotalTickers",
        formatNumber(
            data.total_tickers
        )
    );


    setText(
        "obDuration",
        data.duration_text ||
        "-"
    );


    setText(
        "obErrors",
        data.errors ??
        0
    );


    setText(
        "obLastScan",
        data.finished_at ||
        data.generated_at ||
        "-"
    );


    setText(
        "obGeneratedAt",
        data.generated_at ||
        "-"
    );


    // -----------------------------------------------------
    // PROGRESS
    // -----------------------------------------------------

    const processed =
        Number(
            data.processed ||
            0
        );


    const total =
        Number(
            data.total_tickers ||
            0
        );


    let progress = 0;


    if (total > 0) {

        progress =
            Math.round(
                (
                    processed /
                    total
                ) *
                100
            );

    }


    if (progress > 100) {

        progress = 100;

    }


    setText(
        "obProgress",
        total > 0
            ? processed +
              " / " +
              total
            : "-"
    );


    setWidth(
        "obProgressFill",
        progress
    );


    // -----------------------------------------------------
    // TABLE
    // -----------------------------------------------------

    const tbody =
        document.getElementById(
            "obResultBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    const rows =
        Array.isArray(
            data.data
        )
            ? data.data
            : [];


    // -----------------------------------------------------
    // NO DATA
    // -----------------------------------------------------

    if (rows.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="11">
                    Tidak ada kandidat
                </td>
            </tr>
        `;

        return;

    }


    // -----------------------------------------------------
    // RENDER ROW
    // -----------------------------------------------------

    rows.forEach(
        function (row) {

            const tr =
                document.createElement(
                    "tr"
                );


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


            tbody.appendChild(
                tr
            );

        }
    );

}


// =========================================================
// LOAD MACD
// =========================================================

async function loadMacdResults() {

    const data =
        await fetchJson(
            MACD_RESULTS_URL
        );


    renderMACD(
        data
    );

}


// =========================================================
// RENDER MACD
// =========================================================

function renderMACD(
    data
) {

    // -----------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------

    setText(
        "macdCandidateCount",
        formatNumber(
            data.candidates
        )
    );


    setText(
        "macdTotalTickers",
        formatNumber(
            data.total_tickers
        )
    );


    setText(
        "macdDuration",
        data.duration_text ||
        "-"
    );


    setText(
        "macdErrors",
        data.errors ??
        0
    );


    setText(
        "macdLastScan",
        data.finished_at ||
        data.generated_at ||
        "-"
    );


    setText(
        "macdGeneratedAt",
        data.generated_at ||
        "-"
    );


    // -----------------------------------------------------
    // PROGRESS
    // -----------------------------------------------------

    const processed =
        Number(
            data.processed ||
            0
        );


    const total =
        Number(
            data.total_tickers ||
            0
        );


    let progress = 0;


    if (total > 0) {

        progress =
            Math.round(
                (
                    processed /
                    total
                ) *
                100
            );

    }


    if (progress > 100) {

        progress = 100;

    }


    setText(
        "macdProgress",
        total > 0
            ? processed +
              " / " +
              total
            : "-"
    );


    setWidth(
        "macdProgressFill",
        progress
    );


    // -----------------------------------------------------
    // TABLE
    // -----------------------------------------------------

    const tbody =
        document.getElementById(
            "macdResultBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    const rows =
        Array.isArray(
            data.data
        )
            ? data.data
            : [];


    // -----------------------------------------------------
    // NO DATA
    // -----------------------------------------------------

    if (rows.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    Tidak ada kandidat
                </td>
            </tr>
        `;

        return;

    }


    // -----------------------------------------------------
    // RENDER ROW
    // -----------------------------------------------------

    rows.forEach(
        function (row) {

            const tr =
                document.createElement(
                    "tr"
                );


            const quality =
                String(
                    row.quality ||
                    ""
                ).toUpperCase();


            let qualityClass =
                quality.toLowerCase();


            if (
                qualityClass !== "high" &&
                qualityClass !== "med" &&
                qualityClass !== "low"
            ) {

                qualityClass = "low";

            }


            tr.innerHTML = `

                <td>
                    ${safe(row.ticker)}
                </td>

                <td>
                    ${formatNumber(row.price)}
                </td>

                <td>
                    ${formatNumber(row.spike_ratio)}x
                </td>

                <td>
                    ${safe(row.hist_age)}
                </td>

                <td>
                    ${formatNumber(row.macd_hist)}
                </td>

                <td>
                    ${safe(row.value)}
                </td>

                <td>
                    ${formatNumber(row.ema20)}
                </td>

                <td>
                    ${safe(row.ema20_break_age)}
                </td>

                <td>

                    <span
                        class="
                            quality
                            ${qualityClass}
                        "
                    >
                        ${safe(quality)}
                    </span>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


// =========================================================
// LOAD HISTORY
// =========================================================

async function loadHistory() {

    const data =
        await fetchJson(
            HISTORY_URL
        );


    if (
        !data ||
        typeof data !== "object"
    ) {

        historyData = [];

        renderHistory();

        return;

    }


    if (
        Array.isArray(
            data.history
        )
    ) {

        historyData =
            data.history;

    } else {

        historyData = [];

    }


    setText(
        "historyUpdated",
        data.updated_at
            ? "Update " +
              data.updated_at
            : "-"
    );


    renderHistory();

}


// =========================================================
// HISTORY FILTER
// =========================================================

function setHistoryFilter(
    filter
) {

    historyFilter =
        filter;


    const buttons =
        document.querySelectorAll(
            ".filter-btn"
        );


    buttons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.filter ===
                filter
            );

        }
    );


    renderHistory();

}


// =========================================================
// RENDER HISTORY
// =========================================================

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    if (!container) {

        return;

    }


    let rows =
        Array.isArray(historyData)
            ? historyData
            : [];


    // -----------------------------------------------------
    // FILTER
    // -----------------------------------------------------

    if (
        historyFilter !== "ALL"
    ) {

        rows =
            rows.filter(
                function (row) {

                    return (
                        row.scanner ===
                        historyFilter
                    );

                }
            );

    }


    // -----------------------------------------------------
    // NO DATA
    // -----------------------------------------------------

    if (!rows.length) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada riwayat scan.
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    // -----------------------------------------------------
    // HISTORY ROW
    // -----------------------------------------------------

    rows.forEach(
        function (row) {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "history-item";


            // -------------------------------------------------
            // DATE / TIME
            // -------------------------------------------------

            const generated =
                String(
                    row.generated_at ||
                    "-"
                );


            const parts =
                generated.split(
                    " "
                );


            const date =
                parts[0] ||
                "-";


            const time =
                parts[1] ||
                "-";


            // -------------------------------------------------
            // SCANNER CLASS
            // -------------------------------------------------

            const scannerClass =
                row.scanner === "MACD"
                    ? "macd"
                    : "ob";


            // -------------------------------------------------
            // CANDIDATES
            // -------------------------------------------------

            const candidates =
                Array.isArray(
                    row.data
                )
                    ? row.data
                    : [];


            // -------------------------------------------------
            // TICKER LIST
            // -------------------------------------------------

            let tickerHtml = "";


            if (
                candidates.length > 0
            ) {

                tickerHtml =
                    candidates
                        .map(
                            function (
                                candidate
                            ) {

                                return `
                                    <span
                                        class="ticker-chip"
                                    >
                                        ${safe(
                                            candidate.ticker
                                        )}
                                    </span>
                                `;

                            }
                        )
                        .join("");

            } else {

                tickerHtml = `
                    <span
                        class="ticker-chip"
                    >
                        Tidak ada kandidat
                    </span>
                `;

            }


            // -------------------------------------------------
            // HTML
            // -------------------------------------------------

            item.innerHTML = `

                <div
                    class="history-main"
                >

                    <div>

                        <div
                            class="history-date"
                        >
                            ${safe(date)}
                        </div>

                        <div
                            class="history-time"
                        >
                            ${safe(time)}
                        </div>

                    </div>


                    <div>

                        <div
                            class="history-scanner"
                        >
                            ${safe(
                                row.scanner
                            )}
                        </div>

                        <div
                            class="history-meta"
                        >
                            ${formatNumber(
                                row.total_tickers
                            )}
                            ticker
                            ·
                            ${safe(
                                row.duration_text ||
                                "-"
                            )}
                            · error
                            ${safe(
                                row.errors ??
                                0
                            )}
                        </div>

                    </div>


                    <div
                        class="
                            history-count
                            ${scannerClass}
                        "
                    >

                        ${formatNumber(
                            row.candidates
                        )}
                        kandidat

                    </div>


                    <button
                        class="history-toggle"
                        onclick="toggleHistory(this)"
                        aria-label="Lihat kandidat"
                    >
                        +
                    </button>

                </div>


                <div
                    class="history-data"
                >

                    <div
                        class="
                            history-ticker-list
                        "
                    >

                        ${tickerHtml}

                    </div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


// =========================================================
// TOGGLE HISTORY
// =========================================================

function toggleHistory(
    button
) {

    if (!button) {

        return;

    }


    const item =
        button.closest(
            ".history-item"
        );


    if (!item) {

        return;

    }


    const data =
        item.querySelector(
            ".history-data"
        );


    if (!data) {

        return;

    }


    const isOpen =
        data.classList.toggle(
            "open"
        );


    button.textContent =
        isOpen
            ? "−"
            : "+";

}


// =========================================================
// STATUS
// =========================================================

function setStatus(
    type,
    text
) {

    const statusDot =
        document.getElementById(
            "statusDot"
        );


    const statusText =
        document.getElementById(
            "statusText"
        );


    if (statusDot) {

        statusDot.className =
            "status-dot " +
            type;

    }


    if (statusText) {

        statusText.textContent =
            text;

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


    if (!element) {

        return;

    }


    element.textContent =
        value;

}


// =========================================================
// SET WIDTH
// =========================================================

function setWidth(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    let width =
        Number(value);


    if (
        Number.isNaN(width)
    ) {

        width = 0;

    }


    if (width < 0) {

        width = 0;

    }


    if (width > 100) {

        width = 100;

    }


    element.style.width =
        width +
        "%";

}


// =========================================================
// FORMAT NUMBER
// =========================================================

function formatNumber(
    value
) {

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

function formatPercent(
    value
) {

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
    ) +
    "%";

}


// =========================================================
// SAFE HTML
// =========================================================

function safe(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }


    return String(value)
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

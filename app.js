/* =========================================================
   MARKET SCANNER
   app.js
   SMC OB + MACD + HISTORY + SECTOR
========================================================= */

"use strict";

/* =========================================================
   FILE DATA
========================================================= */

const DATA_FILES = {
    ob: "results.json",
    macd: "macd_results.json",
    status: "scan_status.json",
    history: "history.json",
    sector: "sector_map.json"
};


/* =========================================================
   GLOBAL DATA
========================================================= */

let OB = null;
let MACD = null;
let STATUS = null;
let HISTORY = null;
let SECTOR_MAP = {};


/* =========================================================
   START APP
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("MARKET SCANNER app.js AKTIF");
    console.log("=================================");

    aktifkanHalamanPertama();

    setupTabs();

    setupHistoryFilter();

    loadData();

    /*
       Refresh data setiap 30 detik
    */
    setInterval(function () {
        loadData();
    }, 30000);

});


/* =========================================================
   LOAD SEMUA DATA
========================================================= */

async function loadData() {

    setConnection("Menghubungkan...");

    try {

        const hasil = await Promise.all([

            getJSON(DATA_FILES.ob),
            getJSON(DATA_FILES.macd),
            getJSON(DATA_FILES.status),
            getJSON(DATA_FILES.history),
            getJSON(DATA_FILES.sector)

        ]);

        OB = hasil[0];
        MACD = hasil[1];
        STATUS = hasil[2];
        HISTORY = hasil[3];

        /*
           sector_map.json bisa berbentuk:

           {
               "map": {
                   "ANTM.JK": "BASIC MATERIALS"
               }
           }

           atau langsung:

           {
               "ANTM.JK": "BASIC MATERIALS"
           }
        */

        if (
            hasil[4] &&
            hasil[4].map &&
            typeof hasil[4].map === "object"
        ) {

            SECTOR_MAP = hasil[4].map;

        } else {

            SECTOR_MAP = hasil[4] || {};

        }


        console.log("OB DATA:", OB);
        console.log("MACD DATA:", MACD);
        console.log("STATUS:", STATUS);
        console.log("HISTORY:", HISTORY);
        console.log("SECTOR MAP:", SECTOR_MAP);


        setConnection("Terhubung");


        renderAll();

    }

    catch (error) {

        console.error(
            "GAGAL MEMUAT DATA:",
            error
        );

        setConnection(
            "Gagal menghubungkan"
        );

        tampilkanError(error);

    }

}


/* =========================================================
   FETCH JSON
========================================================= */

async function getJSON(file) {

    const url =
        file +
        "?v=" +
        Date.now();


    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            file +
            " HTTP " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================================
   ERROR
========================================================= */

function tampilkanError(error) {

    const containers = [

        "current-ob",
        "current-macd",
        "history-recap",
        "history-table",
        "recap-table"

    ];


    containers.forEach(function (id) {

        const el =
            document.getElementById(id);


        if (!el) {
            return;
        }


        el.innerHTML = `
            <div class="empty-state">
                Data belum dapat dimuat.
                <br>
                <small>
                    ${esc(error.message)}
                </small>
            </div>
        `;

    });

}


/* =========================================================
   RENDER SEMUA
========================================================= */

function renderAll() {

    renderCurrentOB();

    renderCurrentMACD();

    renderOBPage();

    renderMACDPage();

    renderStatus();

    renderHistory();

    aktifkanHalamanPertama();

}


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnection(text) {

    const ids = [

        "connection-status",
        "connection",
        "status-connection"

    ];


    ids.forEach(function (id) {

        const el =
            document.getElementById(id);


        if (el) {

            el.textContent = text;

        }

    });


    document
        .querySelectorAll(
            ".connection-status"
        )
        .forEach(function (el) {

            el.textContent = text;

        });

}


/* =========================================================
   CURRENT SMC OB
========================================================= */

function renderCurrentOB() {

    const data =
        getData(OB);


    const container =
        findElement([

            "current-ob",
            "ob-current",
            "smc-ob-current",
            "current-ob-list",
            "ob-current-list"

        ]);


    if (!container) {

        console.warn(
            "Container SMC OB tidak ditemukan"
        );

        return;

    }


    if (!data.length) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat SMC OB
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="candidate-list">

            ${data
                .map(function (item) {

                    const ticker =
                        getTicker(item);

                    const sector =
                        getSector(ticker);


                    return `

                        <div class="candidate-chip">

                            <div class="candidate-ticker">
                                ${esc(ticker)}
                            </div>

                            <div class="candidate-sector">
                                ${esc(
                                    shortSector(sector)
                                )}
                            </div>

                        </div>

                    `;

                })
                .join("")}

        </div>

    `;

}


/* =========================================================
   CURRENT MACD
========================================================= */

function renderCurrentMACD() {

    const data =
        getData(MACD);


    const container =
        findElement([

            "current-macd",
            "macd-current",
            "current-macd-list",
            "macd-current-list"

        ]);


    if (!container) {

        console.warn(
            "Container MACD tidak ditemukan"
        );

        return;

    }


    if (!data.length) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat MACD
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="candidate-list">

            ${data
                .map(function (item) {

                    const ticker =
                        getTicker(item);

                    const sector =
                        getSector(ticker);


                    return `

                        <div class="candidate-chip">

                            <div class="candidate-ticker">
                                ${esc(ticker)}
                            </div>

                            <div class="candidate-sector">
                                ${esc(
                                    shortSector(sector)
                                )}
                            </div>

                        </div>

                    `;

                })
                .join("")}

        </div>

    `;

}


/* =========================================================
   SMC OB PAGE
========================================================= */

function renderOBPage() {

    renderMetric(
        "ob-total",
        OB?.total_tickers
    );


    renderMetric(
        "ob-processed",
        OB?.processed
    );


    renderMetric(
        "ob-candidates",
        OB?.candidates
    );


    renderMetric(
        "ob-errors",
        OB?.errors
    );


    renderMetric(
        "ob-duration",
        OB?.duration_text
    );


    renderTable(
        [
            "ob-table",
            "smc-ob-table",
            "ob-results"
        ],
        OB
    );

}


/* =========================================================
   MACD PAGE
========================================================= */

function renderMACDPage() {

    renderMetric(
        "macd-total",
        MACD?.total_tickers
    );


    renderMetric(
        "macd-processed",
        MACD?.processed
    );


    renderMetric(
        "macd-candidates",
        MACD?.candidates
    );


    renderMetric(
        "macd-errors",
        MACD?.errors
    );


    renderMetric(
        "macd-duration",
        MACD?.duration_text
    );


    renderTable(
        [
            "macd-table",
            "macd-results"
        ],
        MACD
    );

}


/* =========================================================
   METRIC
========================================================= */

function renderMetric(id, value) {

    const el =
        document.getElementById(id);


    if (!el) {
        return;
    }


    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        el.textContent = "-";

    }

    else {

        el.textContent = value;

    }

}


/* =========================================================
   TABLE SCANNER
========================================================= */

function renderTable(ids, payload) {

    const container =
        findElement(ids);


    if (!container) {

        console.warn(
            "Table container tidak ditemukan:",
            ids
        );

        return;

    }


    const data =
        getData(payload);


    if (!data.length) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat
            </div>
        `;

        return;

    }


    const keys =
        getExtraKeys(data);


    let html = `

        <div class="table-wrapper">

            <table class="scanner-table">

                <thead>

                    <tr>

                        <th>No</th>

                        <th>Emiten</th>

                        <th>Sektor</th>

    `;


    keys.forEach(function (key) {

        html += `

            <th>
                ${esc(formatKey(key))}
            </th>

        `;

    });


    html += `

                    </tr>

                </thead>

                <tbody>

    `;


    data.forEach(
        function (item, index) {

            const ticker =
                getTicker(item);


            const sector =
                getSector(ticker);


            html += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${esc(ticker)}
                        </strong>
                    </td>

                    <td>

                        <span class="sector-badge">

                            ${esc(
                                shortSector(
                                    sector
                                )
                            )}

                        </span>

                    </td>

            `;


            keys.forEach(
                function (key) {

                    html += `

                        <td>
                            ${formatValue(
                                item[key]
                            )}
                        </td>

                    `;

                }
            );


            html += `

                </tr>

            `;

        }
    );


    html += `

                </tbody>

            </table>

        </div>

    `;


    container.innerHTML = html;

}


/* =========================================================
   EXTRA KEYS
========================================================= */

function getExtraKeys(data) {

    if (!data.length) {
        return [];
    }


    const excluded = [

        "ticker",
        "symbol",
        "code",
        "kode",
        "sector",
        "sektor"

    ];


    const result = [];


    data.forEach(function (item) {

        if (
            !item ||
            typeof item !== "object"
        ) {

            return;

        }


        Object.keys(item)
            .forEach(function (key) {

                if (
                    excluded.indexOf(
                        key.toLowerCase()
                    ) === -1
                ) {

                    if (
                        result.indexOf(key) === -1
                    ) {

                        result.push(key);

                    }

                }

            });

    });


    return result.slice(0, 10);

}


/* =========================================================
   STATUS
========================================================= */

function renderStatus() {

    const container =
        findElement([

            "quick-status",
            "scanner-status",
            "status"

        ]);


    if (!container || !STATUS) {
        return;
    }


    const ob =
        STATUS.ob || {};


    const macd =
        STATUS.macd || {};


    const obProgress =
        ob.progress ?? 0;


    const obTotal =
        ob.total ??
        ob.total_tickers ??
        0;


    const macdProgress =
        macd.progress ?? 0;


    const macdTotal =
        macd.total ??
        macd.total_tickers ??
        0;


    container.innerHTML = `

        <div class="status-item">

            <span>SMC OB</span>

            <strong>
                ${esc(
                    statusText(
                        ob.status
                    )
                )}
            </strong>

            <small>
                ${obProgress}/${obTotal}
            </small>

        </div>


        <div class="status-item">

            <span>MACD</span>

            <strong>
                ${esc(
                    statusText(
                        macd.status
                    )
                )}
            </strong>

            <small>
                ${macdProgress}/${macdTotal}
            </small>

        </div>


        <div class="status-item">

            <span>Update</span>

            <strong>

                ${esc(
                    STATUS.finished_at ||
                    STATUS.updated_at ||
                    "-"
                )}

            </strong>

        </div>

    `;

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    const container =
        findElement([

            "history-recap",
            "history-table",
            "recap-table",
            "history"

        ]);


    if (!container) {

        console.warn(
            "Container history tidak ditemukan"
        );

        return;

    }


    const history =
        Array.isArray(
            HISTORY?.history
        )
            ? HISTORY.history
            : [];


    if (!history.length) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada history
            </div>
        `;

        return;

    }


    const filter =
        getActiveHistoryFilter();


    const grouped = {};


    history.forEach(function (item) {

        if (
            !item ||
            !item.generated_at
        ) {

            return;

        }


        /*
           Jika filter aktif:
           Semua
           SMC OB
           MACD
        */

        if (
            filter !== "ALL" &&
            item.scanner !== filter
        ) {

            return;

        }


        const date =
            String(
                item.generated_at
            ).substring(0, 10);


        if (!grouped[date]) {

            grouped[date] = {

                ob: [],
                macd: []

            };

        }


        if (
            item.scanner === "SMC OB"
        ) {

            grouped[date].ob.push(item);

        }


        if (
            item.scanner === "MACD"
        ) {

            grouped[date].macd.push(item);

        }

    });


    const dates =
        Object.keys(grouped)
            .sort()
            .reverse();


    if (!dates.length) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada data untuk filter ini
            </div>
        `;

        return;

    }


    let html = `

        <div class="table-wrapper">

            <table class="recap-table">

                <thead>

                    <tr>

                        <th>Tanggal</th>

                        <th>SMC OB</th>

                        <th>MACD</th>

                    </tr>

                </thead>

                <tbody>

    `;


    dates.forEach(function (date) {

        html += `

            <tr>

                <td class="recap-date">

                    ${esc(
                        formatDate(date)
                    )}

                </td>


                <td>

                    ${renderHistoryCell(
                        grouped[date].ob
                    )}

                </td>


                <td>

                    ${renderHistoryCell(
                        grouped[date].macd
                    )}

                </td>

            </tr>

        `;

    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    container.innerHTML = html;

}


/* =========================================================
   HISTORY CELL
========================================================= */

function renderHistoryCell(
    snapshots
) {

    if (!snapshots.length) {

        return `
            <span class="muted">
                —
            </span>
        `;

    }


    snapshots.sort(
        function (a, b) {

            return String(
                a.slot || ""
            ).localeCompare(
                String(
                    b.slot || ""
                )
            );

        }
    );


    return snapshots
        .map(function (snapshot) {

            const data =
                getData(snapshot);


            const tickers =
                data
                    .map(getTicker)
                    .filter(Boolean);


            return `

                <div class="recap-slot">

                    <span class="time-badge">

                        ${esc(
                            snapshot.slot ||
                            "--:--"
                        )}

                    </span>


                    <div class="recap-tickers">

                        ${
                            tickers.length

                            ?

                            tickers
                                .map(
                                    function (
                                        ticker
                                    ) {

                                        return `

                                            <span class="ticker-chip">

                                                ${esc(
                                                    ticker
                                                )}

                                            </span>

                                        `;

                                    }
                                )
                                .join("")

                            :

                            `
                                <span class="muted">
                                    Tidak ada kandidat
                                </span>
                            `
                        }

                    </div>

                </div>

            `;

        })
        .join("");

}


/* =========================================================
   HISTORY FILTER
========================================================= */

function setupHistoryFilter() {

    document
        .querySelectorAll(
            "[data-history-filter]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            "[data-history-filter]"
                        )
                        .forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    renderHistory();

                }
            );

        });

}


/* =========================================================
   GET ACTIVE HISTORY FILTER
========================================================= */

function getActiveHistoryFilter() {

    const active =
        document.querySelector(
            "[data-history-filter].active"
        );


    if (!active) {
        return "ALL";
    }


    const value =
        active.dataset.historyFilter;


    if (!value) {
        return "ALL";
    }


    const normalized =
        String(value)
            .trim()
            .toUpperCase();


    if (
        normalized === "SMC OB" ||
        normalized === "SMC_OB"
    ) {

        return "SMC OB";

    }


    if (
        normalized === "MACD"
    ) {

        return "MACD";

    }


    return "ALL";

}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(function (button) {

            /*
               Hindari listener ganda
            */

            if (
                button.dataset
                    .scannerTabReady === "1"
            ) {

                return;

            }


            button.dataset
                .scannerTabReady = "1";


            button.addEventListener(
                "click",
                function () {

                    const page =
                        button.dataset.page;


                    document
                        .querySelectorAll(
                            "[data-page]"
                        )
                        .forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            function (section) {

                                section.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    const target =
                        document.getElementById(
                            page
                        );


                    if (target) {

                        target.classList.add(
                            "active"
                        );

                    }

                }
            );

        });

}


/* =========================================================
   AKTIFKAN HALAMAN PERTAMA
========================================================= */

function aktifkanHalamanPertama() {

    const pages =
        document.querySelectorAll(
            ".page"
        );


    if (!pages.length) {
        return;
    }


    const active =
        document.querySelector(
            ".page.active"
        );


    if (!active) {

        pages[0].classList.add(
            "active"
        );

    }


    const tabs =
        document.querySelectorAll(
            "[data-page]"
        );


    if (!tabs.length) {
        return;
    }


    const activeTab =
        document.querySelector(
            "[data-page].active"
        );


    if (!activeTab) {

        tabs[0].classList.add(
            "active"
        );

    }

}


/* =========================================================
   GET DATA ARRAY
========================================================= */

function getData(payload) {

    if (!payload) {
        return [];
    }


    if (Array.isArray(payload)) {
        return payload;
    }


    if (
        Array.isArray(
            payload.data
        )
    ) {

        return payload.data;

    }


    /*
       Beberapa format JSON
       mungkin menggunakan candidates
    */

    if (
        Array.isArray(
            payload.candidates
        )
    ) {

        return payload.candidates;

    }


    return [];

}


/* =========================================================
   GET TICKER
========================================================= */

function getTicker(item) {

    if (
        !item ||
        typeof item !== "object"
    ) {

        return "";

    }


    const keys = [

        "ticker",
        "symbol",
        "code",
        "kode",
        "Ticker",
        "Symbol",
        "TICKER",
        "SYMBOL"

    ];


    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const key =
            keys[i];


        if (
            item[key] !== undefined &&
            item[key] !== null &&
            String(
                item[key]
            ).trim() !== ""
        ) {

            return String(
                item[key]
            )
                .trim()
                .toUpperCase();

        }

    }


    return "";

}


/* =========================================================
   GET SECTOR
========================================================= */

function getSector(ticker) {

    if (!ticker) {

        return "UNKNOWN";

    }


    const clean =
        String(ticker)
            .trim()
            .toUpperCase()
            .replace(
                /\s/g,
                ""
            );


    /*
       Coba beberapa kemungkinan key
    */

    const candidates = [

        clean,

        clean + ".JK",

        clean.replace(
            /\.JK$/i,
            ""
        ),

        clean.replace(
            /\.JK$/i,
            ""
        ) + ".JK"

    ];


    for (
        let i = 0;
        i < candidates.length;
        i++
    ) {

        const key =
            candidates[i];


        if (
            SECTOR_MAP[key]
        ) {

            return SECTOR_MAP[key];

        }

    }


    /*
       Fallback case-insensitive
    */

    const mapKeys =
        Object.keys(
            SECTOR_MAP || {}
        );


    for (
        let i = 0;
        i < mapKeys.length;
        i++
    ) {

        if (
            String(
                mapKeys[i]
            )
                .toUpperCase() ===
            clean
        ) {

            return SECTOR_MAP[
                mapKeys[i]
            ];

        }


        if (
            String(
                mapKeys[i]
            )
                .toUpperCase() ===
            clean + ".JK"
        ) {

            return SECTOR_MAP[
                mapKeys[i]
            ];

        }

    }


    return "UNKNOWN";

}


/* =========================================================
   SHORT SECTOR
========================================================= */

function shortSector(sector) {

    const map = {

        "BASIC MATERIALS":
            "Basic Materials",

        "CONSUMER CYCLICALS":
            "Consumer Cyclicals",

        "CONSUMER NON-CYCLICALS":
            "Consumer Non-Cyclicals",

        "ENERGY":
            "Energy",

        "FINANCIALS":
            "Financials",

        "HEALTHCARE":
            "Healthcare",

        "INDUSTRIALS":
            "Industrials",

        "INFRASTRUCTURES":
            "Infrastructure",

        "PROPERTIES & REAL ESTATE":
            "Properties & Real Estate",

        "TECHNOLOGY":
            "Technology",

        "TRANSPORTATION & LOGISTIC":
            "Transportation & Logistic"

    };


    const normalized =
        String(
            sector || ""
        )
            .trim()
            .toUpperCase();


    return (
        map[normalized] ||
        sector ||
        "Unknown"
    );

}


/* =========================================================
   FORMAT KEY
========================================================= */

function formatKey(key) {

    return String(key)

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            function (char) {

                return char.toUpperCase();

            }
        );

}


/* =========================================================
   FORMAT VALUE
========================================================= */

function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    if (
        typeof value === "number"
    ) {

        return value.toLocaleString(
            "id-ID",
            {
                maximumFractionDigits: 4
            }
        );

    }


    if (
        typeof value === "boolean"
    ) {

        return value
            ? "Ya"
            : "Tidak";

    }


    if (
        typeof value === "object"
    ) {

        return esc(
            JSON.stringify(
                value
            )
        );

    }


    return esc(
        String(value)
    );

}


/* =========================================================
   STATUS TEXT
========================================================= */

function statusText(status) {

    const map = {

        running:
            "Running",

        success:
            "Selesai",

        failed:
            "Gagal",

        error:
            "Error",

        pending:
            "Menunggu",

        skipped:
            "Skip",

        skip:
            "Skip",

        queued:
            "Menunggu",

        cancelled:
            "Dibatalkan"

    };


    const normalized =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    return (
        map[normalized] ||
        status ||
        "-"
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(date) {

    if (!date) {
        return "-";
    }


    const d =
        new Date(
            String(date) +
            "T00:00:00"
        );


    if (
        isNaN(
            d.getTime()
        )
    ) {

        return date;

    }


    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des"

    ];


    return (

        String(
            d.getDate()
        ).padStart(2, "0")

        +

        " "

        +

        months[
            d.getMonth()
        ]

    );

}


/* =========================================================
   FIND ELEMENT
========================================================= */

function findElement(ids) {

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const el =
            document.getElementById(
                ids[i]
            );


        if (el) {

            return el;

        }

    }


    return null;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {

    return String(

        value === undefined ||
        value === null
            ? ""
            : value

    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "MARKET SCANNER: app.js loaded"
);

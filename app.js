/* =========================================================
   MARKET SCANNER - app.js
   SMC OB + MACD
========================================================= */

const DATA_FILES = {
    ob: "results.json",
    macd: "macd_results.json",
    status: "scan_status.json",
    history: "history.json",
    sector: "sector_map.json"
};

let OB = null;
let MACD = null;
let STATUS = null;
let HISTORY = null;
let SECTOR_MAP = {};

document.addEventListener("DOMContentLoaded", function () {

    console.log("MARKET SCANNER app.js aktif");

    // Pastikan halaman pertama aktif
    aktifkanHalamanPertama();

    // Jalankan scanner
    loadData();

    // Refresh setiap 30 detik
    setInterval(loadData, 30000);

    // Tombol tab
    setupTabs();

    // Filter history
    setupHistoryFilter();
});


/* =========================================================
   LOAD DATA
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

        if (hasil[4] && hasil[4].map) {
            SECTOR_MAP = hasil[4].map;
        } else {
            SECTOR_MAP = hasil[4] || {};
        }

        console.log("OB:", OB);
        console.log("MACD:", MACD);
        console.log("STATUS:", STATUS);
        console.log("HISTORY:", HISTORY);
        console.log("SECTOR:", SECTOR_MAP);

        setConnection("Terhubung");

        renderAll();

    } catch (error) {

        console.error("Gagal memuat data:", error);

        setConnection("Gagal menghubungkan");

    }
}


/* =========================================================
   FETCH JSON
========================================================= */

async function getJSON(file) {

    const url = file + "?v=" + Date.now();

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            file + " HTTP " + response.status
        );
    }

    return await response.json();
}


/* =========================================================
   RENDER ALL
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
   CONNECTION
========================================================= */

function setConnection(text) {

    const candidates = [
        "connection-status",
        "connection",
        "status-connection"
    ];

    candidates.forEach(function (id) {

        const el = document.getElementById(id);

        if (el) {
            el.textContent = text;
        }

    });

    const textElements =
        document.querySelectorAll(".connection-status");

    textElements.forEach(function (el) {
        el.textContent = text;
    });
}


/* =========================================================
   CURRENT SMC OB
========================================================= */

function renderCurrentOB() {

    const data = getData(OB);

    const count = data.length;

    const container = findElement([
        "current-ob",
        "ob-current",
        "smc-ob-current",
        "current-ob-list"
    ]);

    if (!container) {
        return;
    }

    if (count === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat SMC OB
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="candidate-list">
            ${data.map(function (item) {

                const ticker = getTicker(item);
                const sector = getSector(ticker);

                return `
                    <div class="candidate-chip">

                        <div class="candidate-ticker">
                            ${esc(ticker)}
                        </div>

                        <div class="candidate-sector">
                            ${esc(shortSector(sector))}
                        </div>

                    </div>
                `;

            }).join("")}
        </div>
    `;
}


/* =========================================================
   CURRENT MACD
========================================================= */

function renderCurrentMACD() {

    const data = getData(MACD);

    const count = data.length;

    const container = findElement([
        "current-macd",
        "macd-current",
        "current-macd-list"
    ]);

    if (!container) {
        return;
    }

    if (count === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat MACD
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="candidate-list">
            ${data.map(function (item) {

                const ticker = getTicker(item);
                const sector = getSector(ticker);

                return `
                    <div class="candidate-chip">

                        <div class="candidate-ticker">
                            ${esc(ticker)}
                        </div>

                        <div class="candidate-sector">
                            ${esc(shortSector(sector))}
                        </div>

                    </div>
                `;

            }).join("")}
        </div>
    `;
}


/* =========================================================
   SMC OB PAGE
========================================================= */

function renderOBPage() {

    renderMetric("ob-total", OB?.total_tickers);
    renderMetric("ob-processed", OB?.processed);
    renderMetric("ob-candidates", OB?.candidates);
    renderMetric("ob-errors", OB?.errors);
    renderMetric("ob-duration", OB?.duration_text);

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

    renderMetric("macd-total", MACD?.total_tickers);
    renderMetric("macd-processed", MACD?.processed);
    renderMetric("macd-candidates", MACD?.candidates);
    renderMetric("macd-errors", MACD?.errors);
    renderMetric("macd-duration", MACD?.duration_text);

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

    const el = document.getElementById(id);

    if (!el) {
        return;
    }

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        el.textContent = "-";
    } else {
        el.textContent = value;
    }
}


/* =========================================================
   TABLE
========================================================= */

function renderTable(ids, payload) {

    const container = findElement(ids);

    if (!container) {
        return;
    }

    const data = getData(payload);

    if (data.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat
            </div>
        `;

        return;
    }

    let html = `
        <div class="table-wrapper">

            <table class="scanner-table">

                <thead>
                    <tr>
                        <th>No</th>
                        <th>Emiten</th>
                        <th>Sektor</th>
    `;

    const keys = getExtraKeys(data);

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

    data.forEach(function (item, index) {

        const ticker = getTicker(item);
        const sector = getSector(ticker);

        html += `
            <tr>

                <td>${index + 1}</td>

                <td>
                    <strong>
                        ${esc(ticker)}
                    </strong>
                </td>

                <td>
                    <span class="sector-badge">
                        ${esc(shortSector(sector))}
                    </span>
                </td>
        `;

        keys.forEach(function (key) {

            html += `
                <td>
                    ${formatValue(item[key])}
                </td>
            `;

        });

        html += `
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

        if (!item || typeof item !== "object") {
            return;
        }

        Object.keys(item).forEach(function (key) {

            if (
                excluded.indexOf(
                    key.toLowerCase()
                ) === -1
            ) {

                if (result.indexOf(key) === -1) {
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

    const container = findElement([
        "quick-status",
        "scanner-status",
        "status"
    ]);

    if (!container || !STATUS) {
        return;
    }

    const ob = STATUS.ob || {};
    const macd = STATUS.macd || {};

    container.innerHTML = `
        <div class="status-item">

            <span>SMC OB</span>

            <strong>
                ${esc(statusText(ob.status))}
            </strong>

            <small>
                ${ob.progress || 0}/${ob.total || 0}
            </small>

        </div>

        <div class="status-item">

            <span>MACD</span>

            <strong>
                ${esc(statusText(macd.status))}
            </strong>

            <small>
                ${macd.progress || 0}/${macd.total || 0}
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

    const container = findElement([
        "history-recap",
        "history-table",
        "recap-table",
        "history"
    ]);

    if (!container) {
        return;
    }

    const history =
        Array.isArray(HISTORY?.history)
            ? HISTORY.history
            : [];

    if (history.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada history
            </div>
        `;

        return;
    }

    const grouped = {};

    history.forEach(function (item) {

        if (!item || !item.generated_at) {
            return;
        }

        const date =
            String(item.generated_at).substring(0, 10);

        if (!grouped[date]) {

            grouped[date] = {
                ob: [],
                macd: []
            };

        }

        if (item.scanner === "SMC OB") {
            grouped[date].ob.push(item);
        }

        if (item.scanner === "MACD") {
            grouped[date].macd.push(item);
        }

    });

    const dates =
        Object.keys(grouped)
            .sort()
            .reverse();

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
                    ${esc(formatDate(date))}
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

function renderHistoryCell(snapshots) {

    if (!snapshots.length) {
        return `<span class="muted">—</span>`;
    }

    snapshots.sort(function (a, b) {

        return String(a.slot || "")
            .localeCompare(
                String(b.slot || "")
            );

    });

    return snapshots.map(function (snapshot) {

        const data = getData(snapshot);

        const tickers = data
            .map(getTicker)
            .filter(Boolean);

        return `
            <div class="recap-slot">

                <span class="time-badge">
                    ${esc(snapshot.slot || "--:--")}
                </span>

                <div class="recap-tickers">

                    ${
                        tickers.length
                            ? tickers.map(function (ticker) {

                                return `
                                    <span class="ticker-chip">
                                        ${esc(ticker)}
                                    </span>
                                `;

                            }).join("")
                            : `<span class="muted">
                                Tidak ada kandidat
                               </span>`
                    }

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    document.querySelectorAll(
        "[data-page]"
    ).forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const page =
                    button.dataset.page;

                document.querySelectorAll(
                    "[data-page]"
                ).forEach(function (btn) {

                    btn.classList.remove(
                        "active"
                    );

                });

                document.querySelectorAll(
                    ".page"
                ).forEach(function (section) {

                    section.classList.remove(
                        "active"
                    );

                });

                button.classList.add("active");

                const target =
                    document.getElementById(page);

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
        document.querySelectorAll(".page");

    const active =
        document.querySelector(".page.active");

    if (pages.length > 0 && !active) {

        pages[0].classList.add("active");

    }

    const tabs =
        document.querySelectorAll(
            "[data-page]"
        );

    const activeTab =
        document.querySelector(
            "[data-page].active"
        );

    if (
        tabs.length > 0 &&
        !activeTab
    ) {

        tabs[0].classList.add("active");

    }
}


/* =========================================================
   HISTORY FILTER
========================================================= */

function setupHistoryFilter() {

    document.querySelectorAll(
        "[data-history-filter]"
    ).forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                document.querySelectorAll(
                    "[data-history-filter]"
                ).forEach(function (btn) {

                    btn.classList.remove(
                        "active"
                    );

                });

                button.classList.add("active");

                renderHistory();

            }
        );

    });
}


/* =========================================================
   HELPERS
========================================================= */

function getData(payload) {

    if (!payload) {
        return [];
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload.data)) {
        return payload.data;
    }

    return [];
}


function getTicker(item) {

    if (!item || typeof item !== "object") {
        return "";
    }

    const keys = [
        "ticker",
        "symbol",
        "code",
        "kode",
        "Ticker",
        "Symbol"
    ];

    for (
        let i = 0;
        i < keys.length;
        i++
    ) {

        const key = keys[i];

        if (
            item[key] !== undefined &&
            item[key] !== null &&
            String(item[key]).trim() !== ""
        ) {

            return String(item[key])
                .trim()
                .toUpperCase();

        }

    }

    return "";
}


function getSector(ticker) {

    if (!ticker) {
        return "UNKNOWN";
    }

    const clean =
        ticker
            .toUpperCase()
            .replace(/\s/g, "");

    return (
        SECTOR_MAP[clean] ||
        SECTOR_MAP[clean + ".JK"] ||
        "UNKNOWN"
    );
}


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

    return map[sector] || sector || "Unknown";
}


function formatKey(key) {

    return String(key)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function (char) {
            return char.toUpperCase();
        });
}


function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    if (typeof value === "number") {

        return value.toLocaleString(
            "id-ID",
            {
                maximumFractionDigits: 4
            }
        );

    }

    if (typeof value === "boolean") {
        return value ? "Ya" : "Tidak";
    }

    if (typeof value === "object") {

        return esc(
            JSON.stringify(value)
        );

    }

    return esc(String(value));
}


function statusText(status) {

    const map = {

        running: "Running",
        success: "Selesai",
        failed: "Gagal",
        error: "Error",
        pending: "Menunggu",
        skipped: "Skip"

    };

    return map[
        String(status || "").toLowerCase()
    ] || status || "-";
}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    const d =
        new Date(date + "T00:00:00");

    if (isNaN(d.getTime())) {
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
        String(d.getDate()).padStart(2, "0") +
        " " +
        months[d.getMonth()]
    );
}


function findElement(ids) {

    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const el =
            document.getElementById(ids[i]);

        if (el) {
            return el;
        }

    }

    return null;
}


function esc(value) {

    return String(
        value === undefined ||
        value === null
            ? ""
            : value
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

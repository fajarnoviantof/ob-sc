/* =========================================================
   MARKET SCANNER - app.js
   SMC OB + MACD + SECTOR HISTORY
========================================================= */

const FILES = {
    ob: "results.json",
    macd: "macd_results.json",
    status: "scan_status.json",
    history: "history.json",
    sectors: "sector_map.json"
};

const REFRESH_MS = 30000;

let state = {
    ob: null,
    macd: null,
    status: null,
    history: null,
    sectorMap: {}
};

let historyFilter = "ALL";

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initHistoryFilters();
    loadAll();

    setInterval(loadAll, REFRESH_MS);
});


/* =========================================================
   FETCH JSON
========================================================= */

async function fetchJson(file) {
    try {
        const url = `${file}?t=${Date.now()}`;

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`${file}: HTTP ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error(`Gagal membaca ${file}`, error);
        return null;
    }
}


/* =========================================================
   LOAD ALL
========================================================= */

async function loadAll() {

    const [
        status,
        ob,
        macd,
        history,
        sectorMap
    ] = await Promise.all([
        fetchJson(FILES.status),
        fetchJson(FILES.ob),
        fetchJson(FILES.macd),
        fetchJson(FILES.history),
        fetchJson(FILES.sectors)
    ]);

    state.status = status;
    state.ob = ob;
    state.macd = macd;
    state.history = history;
    state.sectorMap = sectorMap?.map || {};

    renderDashboard();
    renderOB();
    renderMACD();
    renderHistory();

    updateLastRefresh();
}


/* =========================================================
   TAB
========================================================= */

function initTabs() {

    document.querySelectorAll("[data-page]").forEach(button => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            document.querySelectorAll("[data-page]").forEach(btn => {
                btn.classList.remove("active");
            });

            document.querySelectorAll(".page").forEach(section => {
                section.classList.remove("active");
            });

            button.classList.add("active");

            const target = document.getElementById(page);

            if (target) {
                target.classList.add("active");
            }
        });

    });
}


/* =========================================================
   HISTORY FILTER
========================================================= */

function initHistoryFilters() {

    document.querySelectorAll("[data-history-filter]").forEach(button => {

        button.addEventListener("click", () => {

            historyFilter = button.dataset.historyFilter;

            document.querySelectorAll("[data-history-filter]").forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            renderHistory();
        });

    });
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    renderCurrentScanner(
        "current-ob",
        state.ob,
        "SMC OB"
    );

    renderCurrentScanner(
        "current-macd",
        state.macd,
        "MACD"
    );

    renderQuickStatus();
}


/* =========================================================
   CURRENT SCANNER
========================================================= */

function renderCurrentScanner(containerId, payload, scannerName) {

    const container = document.getElementById(containerId);

    if (!container) return;

    if (!payload) {

        container.innerHTML = `
            <div class="empty-state">
                Data ${scannerName} belum tersedia
            </div>
        `;

        return;
    }

    const data = Array.isArray(payload.data)
        ? payload.data
        : [];

    const candidates = Number(payload.candidates || data.length || 0);

    let html = "";

    if (data.length === 0) {

        html = `
            <div class="empty-state">
                Tidak ada kandidat
            </div>
        `;

    } else {

        html = `
            <div class="candidate-list">
                ${data.map(item => renderCandidateChip(item)).join("")}
            </div>
        `;
    }

    container.innerHTML = `
        <div class="scanner-current-header">
            <div>
                <div class="scanner-current-title">
                    ${escapeHtml(scannerName)}
                </div>

                <div class="scanner-current-count">
                    ${candidates} kandidat
                </div>
            </div>

            <div class="scanner-current-time">
                ${formatDateTime(
                    payload.generated_at ||
                    payload.finished_at
                )}
            </div>
        </div>

        ${html}
    `;
}


/* =========================================================
   CANDIDATE CHIP
========================================================= */

function renderCandidateChip(item) {

    const ticker = getTicker(item);

    if (!ticker) {
        return "";
    }

    const sector = getSector(ticker);

    return `
        <div class="candidate-chip">

            <div class="candidate-ticker">
                ${escapeHtml(ticker)}
            </div>

            <div class="candidate-sector">
                ${escapeHtml(shortSector(sector))}
            </div>

        </div>
    `;
}


/* =========================================================
   QUICK STATUS
========================================================= */

function renderQuickStatus() {

    const container = document.getElementById("quick-status");

    if (!container) return;

    const status = state.status;

    if (!status) {
        container.innerHTML = "";
        return;
    }

    const ob = status.ob || {};
    const macd = status.macd || {};

    container.innerHTML = `
        <div class="status-item">
            <span>OB</span>
            <strong>${statusLabel(ob.status)}</strong>
            <small>${ob.progress || 0}/${ob.total || 0}</small>
        </div>

        <div class="status-item">
            <span>MACD</span>
            <strong>${statusLabel(macd.status)}</strong>
            <small>${macd.progress || 0}/${macd.total || 0}</small>
        </div>

        <div class="status-item">
            <span>Update</span>
            <strong>
                ${formatDateTime(
                    status.finished_at ||
                    status.updated_at
                )}
            </strong>
        </div>
    `;
}


/* =========================================================
   SMC OB PAGE
========================================================= */

function renderOB() {

    const payload = state.ob;

    renderMetric(
        "ob-total",
        payload?.total_tickers
    );

    renderMetric(
        "ob-processed",
        payload?.processed
    );

    renderMetric(
        "ob-candidates",
        payload?.candidates
    );

    renderMetric(
        "ob-errors",
        payload?.errors
    );

    renderMetric(
        "ob-duration",
        payload?.duration_text
    );

    renderScannerTable(
        "ob-table",
        payload,
        "SMC OB"
    );
}


/* =========================================================
   MACD PAGE
========================================================= */

function renderMACD() {

    const payload = state.macd;

    renderMetric(
        "macd-total",
        payload?.total_tickers
    );

    renderMetric(
        "macd-processed",
        payload?.processed
    );

    renderMetric(
        "macd-candidates",
        payload?.candidates
    );

    renderMetric(
        "macd-errors",
        payload?.errors
    );

    renderMetric(
        "macd-duration",
        payload?.duration_text
    );

    renderScannerTable(
        "macd-table",
        payload,
        "MACD"
    );
}


/* =========================================================
   METRIC
========================================================= */

function renderMetric(id, value) {

    const element = document.getElementById(id);

    if (!element) return;

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        element.textContent = "-";
        return;
    }

    element.textContent = value;
}


/* =========================================================
   SCANNER TABLE
========================================================= */

function renderScannerTable(
    containerId,
    payload,
    scannerName
) {

    const container = document.getElementById(containerId);

    if (!container) return;

    if (!payload) {

        container.innerHTML = `
            <div class="empty-state">
                Data ${escapeHtml(scannerName)} belum tersedia.
            </div>
        `;

        return;
    }

    const data = Array.isArray(payload.data)
        ? payload.data
        : [];

    if (data.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada kandidat ${escapeHtml(scannerName)}.
            </div>
        `;

        return;
    }

    const columns = getTableColumns(data);

    let html = `
        <div class="table-wrapper">
            <table class="scanner-table">

                <thead>
                    <tr>
                        <th>No</th>
                        ${columns.map(column =>
                            `<th>${escapeHtml(formatColumnName(column))}</th>`
                        ).join("")}
                        <th>Sektor</th>
                    </tr>
                </thead>

                <tbody>
    `;

    data.forEach((item, index) => {

        const ticker = getTicker(item);

        html += `
            <tr>

                <td>${index + 1}</td>

                ${columns.map(column => `
                    <td>
                        ${formatCellValue(item[column])}
                    </td>
                `).join("")}

                <td>
                    <span class="sector-badge">
                        ${escapeHtml(
                            shortSector(getSector(ticker))
                        )}
                    </span>
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
   TABLE COLUMNS
========================================================= */

function getTableColumns(data) {

    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    const excluded = new Set([
        "ticker",
        "symbol",
        "code",
        "kode",
        "sector",
        "sektor"
    ]);

    const columns = [];

    data.forEach(item => {

        if (!item || typeof item !== "object") {
            return;
        }

        Object.keys(item).forEach(key => {

            if (!excluded.has(key.toLowerCase())) {

                if (!columns.includes(key)) {
                    columns.push(key);
                }

            }
        });

    });

    return columns.slice(0, 12);
}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

    renderHeatmap();
    renderRecap();
}


/* =========================================================
   HEATMAP
========================================================= */

function renderHeatmap() {

    const container = document.getElementById("sector-heatmap");

    if (!container) return;

    const history = Array.isArray(state.history?.history)
        ? state.history.history
        : [];

    const slots = [
        "09:00",
        "10:00",
        "11:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00"
    ];

    const sectors = [
        "BASIC MATERIALS",
        "ENERGY",
        "FINANCIALS",
        "INDUSTRIALS",
        "CONSUMER NON-CYCLICALS",
        "CONSUMER CYCLICALS",
        "HEALTHCARE",
        "PROPERTIES & REAL ESTATE",
        "TECHNOLOGY",
        "INFRASTRUCTURES",
        "TRANSPORTATION & LOGISTIC"
    ];

    const dates = getHistoryDates(history);

    if (dates.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada data history dengan slot yang valid.
            </div>
        `;

        return;
    }

    let html = `
        <div class="heatmap-wrapper">

            <table class="heatmap">

                <thead>
                    <tr>
                        <th>Sektor</th>
                        ${slots.map(slot =>
                            `<th>${slot.replace(":00", "")}</th>`
                        ).join("")}
                    </tr>
                </thead>

                <tbody>
    `;

    sectors.forEach(sector => {

        html += `
            <tr>

                <td class="sector-name">
                    ${escapeHtml(shortSector(sector))}
                </td>
        `;

        slots.forEach(slot => {

            const result = calculateSectorActivity(
                history,
                sector,
                slot,
                dates
            );

            const percent = result.available > 0
                ? result.active / result.available
                : 0;

            html += `
                <td
                    class="heat-cell"
                    title="${result.active}/${result.available} hari"
                    data-level="${getHeatLevel(percent)}"
                >
                    ${result.available > 0
                        ? `${Math.round(percent * 100)}%`
                        : "-"
                    }
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
   SECTOR ACTIVITY
========================================================= */

function calculateSectorActivity(
    history,
    sector,
    slot,
    dates
) {

    let active = 0;
    let available = 0;

    dates.forEach(date => {

        const snapshots = history.filter(item => {

            if (!item) return false;

            if (item.slot !== slot) return false;

            if (
                historyFilter !== "ALL" &&
                item.scanner !== historyFilter
            ) {
                return false;
            }

            return String(item.generated_at || "")
                .startsWith(date);
        });

        if (snapshots.length === 0) {
            return;
        }

        available++;

        let found = false;

        snapshots.forEach(snapshot => {

            const data = Array.isArray(snapshot.data)
                ? snapshot.data
                : [];

            data.forEach(item => {

                const ticker = getTicker(item);

                if (
                    ticker &&
                    getSector(ticker) === sector
                ) {
                    found = true;
                }

            });

        });

        if (found) {
            active++;
        }
    });

    return {
        active,
        available
    };
}


/* =========================================================
   HEAT LEVEL
========================================================= */

function getHeatLevel(value) {

    if (value <= 0) return "0";
    if (value < 0.25) return "1";
    if (value < 0.50) return "2";
    if (value < 0.75) return "3";

    return "4";
}


/* =========================================================
   RECAP
========================================================= */

function renderRecap() {

    const container = document.getElementById("history-recap");

    if (!container) return;

    const history = Array.isArray(state.history?.history)
        ? state.history.history
        : [];

    if (history.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Belum ada history scanner.
            </div>
        `;

        return;
    }

    const grouped = {};

    history.forEach(item => {

        if (!item || !item.generated_at) {
            return;
        }

        if (
            historyFilter !== "ALL" &&
            item.scanner !== historyFilter
        ) {
            return;
        }

        const date = String(item.generated_at).slice(0, 10);

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

    const dates = Object.keys(grouped)
        .sort()
        .reverse();

    if (dates.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Tidak ada data untuk filter ini.
            </div>
        `;

        return;
    }

    let html = `
        <div class="recap-wrapper">

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

    dates.forEach(date => {

        const group = grouped[date];

        html += `
            <tr>

                <td class="recap-date">
                    ${formatDateShort(date)}
                </td>

                <td>
                    ${renderHistoryScannerCell(group.ob)}
                </td>

                <td>
                    ${renderHistoryScannerCell(group.macd)}
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
   HISTORY SCANNER CELL
========================================================= */

function renderHistoryScannerCell(snapshots) {

    if (!snapshots || snapshots.length === 0) {
        return `<span class="muted">—</span>`;
    }

    snapshots.sort((a, b) => {
        return String(a.slot || "")
            .localeCompare(String(b.slot || ""));
    });

    return snapshots.map(snapshot => {

        const data = Array.isArray(snapshot.data)
            ? snapshot.data
            : [];

        const tickers = data
            .map(item => getTicker(item))
            .filter(Boolean);

        return `
            <div class="recap-slot">

                <span class="time-badge">
                    ${escapeHtml(snapshot.slot || "--:--")}
                </span>

                <div class="recap-tickers">

                    ${
                        tickers.length
                            ? tickers.map(ticker => `
                                <span class="ticker-chip">
                                    ${escapeHtml(ticker)}
                                </span>
                            `).join("")
                            : `<span class="muted">Tidak ada kandidat</span>`
                    }

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================================
   HISTORY DATES
========================================================= */

function getHistoryDates(history) {

    const dates = new Set();

    history.forEach(item => {

        if (!item?.generated_at) return;

        if (
            historyFilter !== "ALL" &&
            item.scanner !== historyFilter
        ) {
            return;
        }

        dates.add(
            String(item.generated_at).slice(0, 10)
        );
    });

    return Array.from(dates).sort();
}


/* =========================================================
   TICKER DETECTION
========================================================= */

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

    for (const key of keys) {

        if (
            item[key] !== undefined &&
            item[key] !== null &&
            String(item[key]).trim() !== ""
        ) {
            return String(item[key]).trim().toUpperCase();
        }
    }

    return "";
}


/* =========================================================
   SECTOR
========================================================= */

function getSector(ticker) {

    if (!ticker) {
        return "UNKNOWN";
    }

    const cleanTicker = ticker
        .toUpperCase()
        .replace(/\s+/g, "");

    return (
        state.sectorMap[cleanTicker] ||
        state.sectorMap[`${cleanTicker}.JK`] ||
        "UNKNOWN"
    );
}


/* =========================================================
   SHORT SECTOR
========================================================= */

function shortSector(sector) {

    if (!sector || sector === "UNKNOWN") {
        return "Unknown";
    }

    const map = {
        "BASIC MATERIALS": "Basic Materials",
        "CONSUMER CYCLICALS": "Consumer Cyclicals",
        "CONSUMER NON-CYCLICALS": "Consumer Non-Cyclicals",
        "ENERGY": "Energy",
        "FINANCIALS": "Financials",
        "HEALTHCARE": "Healthcare",
        "INDUSTRIALS": "Industrials",
        "INFRASTRUCTURES": "Infrastructure",
        "PROPERTIES & REAL ESTATE": "Properties & Real Estate",
        "TECHNOLOGY": "Technology",
        "TRANSPORTATION & LOGISTIC": "Transportation & Logistic"
    };

    return map[sector] || sector;
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDateShort(date) {

    if (!date) {
        return "-";
    }

    const d = new Date(`${date}T00:00:00`);

    if (Number.isNaN(d.getTime())) {
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

    return `
        ${String(d.getDate()).padStart(2, "0")}
        ${months[d.getMonth()]}
    `;
}


/* =========================================================
   DATETIME FORMAT
========================================================= */

function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    return String(value)
        .replace("T", " ")
        .replace("Z", "");
}


/* =========================================================
   COLUMN NAME
========================================================= */

function formatColumnName(value) {

    if (!value) return "";

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}


/* =========================================================
   CELL VALUE
========================================================= */

function formatCellValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    if (typeof value === "number") {

        return Number.isInteger(value)
            ? value.toLocaleString("id-ID")
            : value.toLocaleString("id-ID", {
                maximumFractionDigits: 4
            });
    }

    if (typeof value === "boolean") {
        return value ? "Ya" : "Tidak";
    }

    if (typeof value === "object") {
        return escapeHtml(
            JSON.stringify(value)
        );
    }

    return escapeHtml(String(value));
}


/* =========================================================
   STATUS LABEL
========================================================= */

function statusLabel(status) {

    if (!status) {
        return "-";
    }

    const map = {
        running: "Running",
        success: "Selesai",
        failed: "Gagal",
        error: "Error",
        pending: "Menunggu",
        skipped: "Skip"
    };

    return map[String(status).toLowerCase()] ||
        String(status);
}


/* =========================================================
   LAST REFRESH
========================================================= */

function updateLastRefresh() {

    const element = document.getElementById("last-refresh");

    if (!element) return;

    const now = new Date();

    element.textContent =
        `Update halaman: ${now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })}`;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
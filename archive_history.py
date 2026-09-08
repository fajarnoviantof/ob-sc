import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

TZ_WIB = ZoneInfo("Asia/Jakarta")
HISTORY_FILE = Path("history.json")
SECTOR_FILE = Path("sector_map.json")
KEEP_DAYS = 31

SCHEDULE_TO_SLOT = {
    "5 9 * * 1-5": "09:00",
    "5 10 * * 1-5": "10:00",
    "5 11 * * 1-5": "11:00",
    "5 13 * * 1-5": "13:00",
    "5 14 * * 1-5": "14:00",
    "5 15 * * 1-5": "15:00",
    "5 16 * * 1-5": "16:00",
    "5 17 * * 1-5": "17:00",
}

def load_json(path):
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def parse_dt(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=TZ_WIB)
    except Exception:
        return None

def add_snapshot(history, scanner, payload, slot, cron):
    if not payload:
        return
    generated_at = payload.get("generated_at") or payload.get("finished_at")
    if not generated_at:
        return

    snapshot = {
        "scanner": scanner,
        "slot": slot,
        "cron": cron,
        "generated_at": generated_at,
        "candidates": payload.get("candidates", 0),
        "total_tickers": payload.get("total_tickers", 0),
        "processed": payload.get("processed", 0),
        "errors": payload.get("errors", 0),
        "duration_text": payload.get("duration_text"),
        "data": payload.get("data", []),
    }

    # Satu snapshot unik berdasarkan scanner + intended slot + tanggal.
    dt = parse_dt(generated_at)
    if dt:
        date_key = dt.strftime("%Y-%m-%d")
        history[:] = [
            x for x in history
            if not (
                x.get("scanner") == scanner
                and x.get("slot") == slot
                and str(x.get("generated_at", "")).startswith(date_key)
            )
        ]

    history.append(snapshot)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ob", default="skipped")
    parser.add_argument("--macd", default="skipped")
    parser.add_argument("--schedule", default="")
    parser.add_argument("--slot", default="")
    args = parser.parse_args()

    # Scheduled run memakai mapping cron.
    # Manual workflow tidak masuk history kecuali slot diberikan.
    slot = args.slot or SCHEDULE_TO_SLOT.get(args.schedule, "")
    cron = args.schedule

    if not slot:
        print("No archive slot. History is not modified for this run.")
        return

    old = load_json(HISTORY_FILE)
    if not isinstance(old, dict):
        old = {}

    history = old.get("history", [])
    if not isinstance(history, list):
        history = []

    if args.ob == "success":
        add_snapshot(
            history,
            "SMC OB",
            load_json(Path("results.json")),
            slot,
            cron
        )

    if args.macd == "success":
        add_snapshot(
            history,
            "MACD",
            load_json(Path("macd_results.json")),
            slot,
            cron
        )

    cutoff = datetime.now(TZ_WIB) - timedelta(days=KEEP_DAYS)

    cleaned = []
    for item in history:
        dt = parse_dt(item.get("generated_at"))
        if dt is None:
            continue
        if dt >= cutoff:
            cleaned.append(item)

    cleaned.sort(
        key=lambda x: (
            x.get("generated_at", ""),
            x.get("scanner", "")
        ),
        reverse=True
    )

    output = {
        "updated_at": datetime.now(TZ_WIB).strftime("%Y-%m-%d %H:%M:%S"),
        "keep_days": KEEP_DAYS,
        "slots": ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
        "history": cleaned
    }

    with HISTORY_FILE.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"History saved: {len(cleaned)} snapshots")

if __name__ == "__main__":
    main()

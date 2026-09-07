import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo


TZ_WIB = ZoneInfo("Asia/Jakarta")
HISTORY_FILE = Path("history.json")
KEEP_DAYS = 31


def load_json(path):

    if not path.exists():

        return None

    try:

        with path.open(
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    except Exception:

        return None


def parse_dt(value):

    if not value:

        return None

    try:

        return datetime.strptime(
            value,
            "%Y-%m-%d %H:%M:%S"
        ).replace(
            tzinfo=TZ_WIB
        )

    except Exception:

        return None


def add_snapshot(
    history,
    scanner,
    payload
):

    if not payload:

        return


    generated_at = (
        payload.get("generated_at")
        or payload.get("finished_at")
    )


    if not generated_at:

        return


    snapshot = {

        "scanner":
            scanner,

        "generated_at":
            generated_at,

        "candidates":
            payload.get(
                "candidates",
                0
            ),

        "total_tickers":
            payload.get(
                "total_tickers",
                0
            ),

        "errors":
            payload.get(
                "errors",
                0
            ),

        "duration_text":
            payload.get(
                "duration_text"
            ),

        "data":
            payload.get(
                "data",
                []
            )

    }


    history.append(
        snapshot
    )


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--ob",
        default="skipped"
    )

    parser.add_argument(
        "--macd",
        default="skipped"
    )

    args = parser.parse_args()


    if HISTORY_FILE.exists():

        old = load_json(
            HISTORY_FILE
        )

    else:

        old = None


    if not isinstance(old, dict):

        old = {}


    history = old.get(
        "history",
        []
    )


    if not isinstance(
        history,
        list
    ):

        history = []


    if args.ob == "success":

        ob = load_json(
            Path("results.json")
        )

        add_snapshot(
            history,
            "SMC OB",
            ob
        )


    if args.macd == "success":

        macd = load_json(
            Path("macd_results.json")
        )

        add_snapshot(
            history,
            "MACD",
            macd
        )


    cutoff = (
        datetime.now(TZ_WIB)
        - timedelta(
            days=KEEP_DAYS
        )
    )


    cleaned = []


    for item in history:

        dt = parse_dt(
            item.get(
                "generated_at"
            )
        )


        if dt is None:

            continue


        if dt >= cutoff:

            cleaned.append(item)


    cleaned.sort(
        key=lambda x: x.get(
            "generated_at",
            ""
        ),
        reverse=True
    )


    output = {

        "updated_at":
            datetime.now(
                TZ_WIB
            ).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),

        "keep_days":
            KEEP_DAYS,

        "history":
            cleaned

    }


    with HISTORY_FILE.open(
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2
        )


    print(
        f"History saved: {len(cleaned)} snapshots"
    )


if __name__ == "__main__":

    main()

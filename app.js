async function loadResults() {

    const body =
        document.getElementById(
            "resultBody"
        );

    const statusText =
        document.getElementById(
            "statusText"
        );

    try {

        statusText.textContent =
            "Loading...";


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
            result.generated_at ?? "-";


        statusText.textContent =
            result.status === "success"
                ? "Data terbaru"
                : "Menunggu scan";


        renderTable(
            result.data || []
        );


    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Gagal memuat data";


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


loadResults();


setInterval(
    loadResults,
    5 * 60 * 1000
);

SMC OB SCANNER — COMPLETE FRONTEND UPDATE

ROOT CAUSE YANG DITEMUKAN
1. index.html memang sudah memanggil app.js.
2. app.js lama mencari ID yang tidak ada di index.html sekarang, sehingga dashboard tidak pernah diisi.
3. app.js lama memakai Promise.all termasuk sector_map.json; file sector_map.json tidak terlihat di repository GitHub saat dicek, sehingga satu 404 membuat seluruh loadData gagal.
4. index.html memanggil switchPage(), refreshAll(), dan setHistoryFilter(), sedangkan app.js lama tidak mendefinisikan fungsi-fungsi tersebut.

FILE PENGGANTI
- index.html
- app.js
- style.css
- sector_map.json
- tickers.py
- archive_history.py
- .github/workflows/scanner.yml

JANGAN GANTI ENGINE
- scanner.py tetap versi Anda sekarang.
- scanner_macd.py tetap versi Anda sekarang.
Keduanya tidak disentuh karena logika scanner harus tetap sama.

FILE DATA
- results.json
- macd_results.json
- history.json
- scan_status.json
Boleh tetap memakai file yang sudah ada.

UPLOAD
Salin file sesuai struktur folder di atas ke repository ob-sc. Setelah commit, tunggu GitHub Pages selesai deploy lalu hard refresh browser (Ctrl+F5).

Ticker: 962 emiten. Sector map: 962 emiten / 11 sektor dari daftar IDX-IC yang diberikan pengguna pada 08 Sep 2026.

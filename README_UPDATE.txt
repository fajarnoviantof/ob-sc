SMC OB SCANNER — UPDATE 08 SEP 2026

FILE YANG DIGANTI / DITAMBAHKAN
1. tickers.py
   - 962 ticker sesuai daftar sektor yang diberikan.
2. sector_map.json
   - Mapping 962 ticker -> 11 sektor.
3. archive_history.py
   - Menyimpan slot intended 09/10/11/13/14/15/16/17 WIB.
   - History tetap 31 hari.
4. app.js
   - Dashboard SCANNER TERKINI langsung menampilkan emiten per screener.
   - Rekap dipisah SMC OB dan MACD per tanggal.
   - Heatmap pola sektor.
5. index.html
   - Tampilan dashboard + detail screener + rekap.
6. style.css
   - Tampilan baru untuk struktur tersebut.
7. .github/workflows/scanner.yml
   - Schedule 5 menit lewat jam bulat, timezone Asia/Jakarta.
   - Manual workflow_dispatch tetap tersedia.
   - Slot intended dicatat walaupun workflow terlambat.

JANGAN GANTI
- scanner.py
- scanner_macd.py

Keduanya tetap memakai tickers.py sehingga otomatis berpindah ke 962 ticker tanpa mengubah engine screener.

JADWAL
09:05, 10:05, 11:05, 13:05, 14:05, 15:05, 16:05, 17:05 WIB.
Slot analisis tetap dianggap 09:00, 10:00, ..., 17:00 WIB.

CATATAN KETEPATAN WAKTU
GitHub Actions schedule bukan scheduler real-time. GitHub mendokumentasikan bahwa scheduled workflow dapat tertunda saat load tinggi, terutama menit 00. Karena itu schedule digeser ke menit 05. Ini mengurangi peluang delay, tetapi tidak bisa menjamin start persis pada menit target.

Jika nanti Anda membutuhkan jaminan start <=15-30 menit, workflow ini sudah siap menerima trigger workflow_dispatch/repository_dispatch dari scheduler eksternal tanpa mengubah scanner engine.

CARA UPLOAD
Upload/replace file sesuai path:
- tickers.py
- sector_map.json
- archive_history.py
- app.js
- index.html
- style.css
- .github/workflows/scanner.yml

Jangan hapus:
- results.json
- macd_results.json
- history.json
- scan_status.json
- scanner.py
- scanner_macd.py

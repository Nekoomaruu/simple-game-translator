# Simple Game Translator

Alat lokal untuk menerjemahkan teks dalam game RPG Maker MV/MZ dan Ren'Py ke Bahasa Indonesia, langsung dari browser, tanpa upload file ke server manapun. Semua pembacaan dan penulisan file terjadi di komputer kamu sendiri.

## Kenapa alat ini ada

Script auto-translate untuk RPG Maker biasanya berupa satu file CLI yang cuma jalan di terminal, tanpa progress yang jelas, dan API key sering nempel di kode. Alat ini membungkus logika yang sama jadi dashboard web lokal: kamu lihat progress-nya, pilih provider terjemahan sendiri, dan bisa merevisi hasil terjemahan yang kaku tanpa buka text editor manual.

## Menjalankan

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
npm install
npm start
```

Buka `http://localhost:4173` di browser.

Panduan lebih lengkap ada di [`docs/installation.md`](./docs/installation.md).

## Cara pakai

Aplikasi punya tiga menu di sidebar:

**Dashboard** — atur provider terjemahan, API key, bahasa sumber default, dan lihat pemakaian kuota. Semua pengaturan ini disimpan di **localStorage browser kamu**, bukan di server atau file — jadi tidak pernah ke-commit ke git secara tidak sengaja, tapi juga berarti tidak ikut pindah kalau ganti browser/device.

**Translate** — taruh project game kamu (folder yang berisi `data/` atau `www/data/`) ke dalam folder `games/`, pilih dari dropdown, klik **Baca folder**, lalu **Mulai terjemahkan**. Progress per file dan per baris teks muncul real-time. Hasil disimpan sebagai folder baru `<folder-asli>_indo` di dalam `games/`, sejajar dengan folder aslinya — folder asli tidak pernah diubah.

**Manual Revisi** — mesin terjemahan (apalagi yang murah/gratis) sering menghasilkan teks yang kaku, baku, atau salah konteks untuk dialog game. Menu ini membaca file hasil terjemahan di `<folder>_indo/` (JSON untuk RPG Maker, `.rpy` untuk Ren'Py), menampilkan tiap baris teks sebagai kotak yang bisa diedit langsung, dan menyimpannya balik ke file aslinya begitu kamu klik **Simpan perubahan** — nama karakter dan elemen `{tag}`/`[variabel]` di file Ren'Py tidak ikut ditampilkan untuk diedit, hanya teks dialognya.

Web ini hanya bisa membaca folder yang ada di dalam `games/` — tidak ada input path bebas, jadi tidak akan mengakses bagian lain dari komputer kamu.

## Provider yang didukung

- **DeepL** — butuh API key dari [deepl.com](https://www.deepl.com/pro-api), tier gratis tersedia. Dashboard bisa menampilkan karakter terpakai dan limit bulanan langsung dari akun DeepL kamu (tombol **Cek kuota**).
- **Google Translate** — tanpa API key, memakai endpoint publik, cocok untuk uji coba cepat. Tidak ada data kuota karena tidak ada akun/API key yang terhubung.
- **OpenAI-compatible** — untuk OpenAI, OpenRouter, atau server lokal seperti LM Studio/Ollama yang punya endpoint `/chat/completions`. Isi base URL dan nama model sendiri. Dashboard mengakumulasi jumlah token yang terpakai selama sesi translate berjalan (reset tiap reload halaman) — provider ini tidak punya endpoint standar untuk cek sisa saldo, jadi angka yang ditampilkan murni token terpakai, bukan sisa kuota.

Untuk teks berbahasa Jepang, aktifkan opsi estafet di Dashboard: game diterjemahkan JA → EN → ID karena kualitasnya umumnya lebih stabil dibanding JA → ID langsung.

## Engine game yang didukung

- **RPG Maker MV/MZ** — folder `data/*.json` (dan `www/data/*.json` kalau ada dua-duanya), plus `plugins.js`.
- **Ren'Py** — file `.rpy` di dalam `game/tl/<bahasa>/`. Folder ini biasanya digenerate lewat Ren'Py Launcher (menu "Generate Translations"), atau bisa juga didapat dari decompile `.rpyc` manual kalau game cuma menyertakan versi terkompilasi — Simple Game Translator mengisi baris terjemahan di dalamnya, bukan membuat strukturnya dari nol. Kalau project punya lebih dari satu folder bahasa sekaligus (mis. `en/` dan `indonesian/` berdampingan — umum terjadi kalau kamu sengaja menimpa folder bahasa asli alih-alih membuat folder baru), menu Translate menampilkan dropdown untuk memilih folder mana yang diproses. Mendukung dua jenis blok terjemahan Ren'Py: dialog cerita (`translate <bahasa> <id>:`) dan string UI/menu (`translate <bahasa> strings:` dengan pasangan `old`/`new`, biasanya di `screens.rpy`). Nama karakter di depan dialog (`e "..."`) dan elemen `{tag}`/`[variabel]` dilindungi otomatis, tidak ikut diterjemahkan atau berubah posisi. Baris dengan lebih dari satu string per baris dan blok `menu:` (pilihan bercabang) belum ditangani di versi ini.

## Struktur proyek

```
server/
  core/           orkestrasi translate, cache, job runner, scoping folder games/, editor revisi
  engines/        logika khusus per game engine (rpgmaker/ dan renpy/ saat ini)
  providers/      integrasi tiap penyedia terjemahan
  routes.js       endpoint API
  index.js        entry point server
public/
  js/
    storage.js    wrapper localStorage untuk pengaturan
    dashboard.js  logika menu Dashboard
    translate.js  logika menu Translate
    revision.js   logika menu Manual Revisi
    app.js        router antar menu
docs/             panduan instalasi dan kontribusi
games/            taruh project game di sini (di-gitignore, tidak ikut ter-commit)
```

Panduan menambah engine atau provider baru ada di [`docs/contributor.md`](./docs/contributor.md).

## Batasan yang perlu diketahui

- API key disimpan di localStorage browser — kalau kamu pakai browser lain atau clear data browser, perlu isi ulang. Ini pilihan desain sengaja: tidak ada file config yang bisa ke-commit berisi key secara tidak sengaja.
- Cache terjemahan disimpan per kombinasi engine/bahasa/provider di `.cache/`, biar menjalankan ulang tidak menerjemahkan ulang teks yang sama.
- Placeholder escape code RPG Maker (`\C[1]`, `\N[1]`, dan sejenisnya) dilindungi otomatis sebelum dikirim ke provider, lalu dikembalikan setelah hasil terjemahan diterima.
- Manual Revisi membaca dan menulis langsung ke file di folder `_indo/` — tidak ada undo di dalam aplikasi, jadi kalau mau aman, backup folder itu sebelum revisi besar-besaran.
- Alat ini tidak memvalidasi lisensi RTP/asset game. Tanggung jawab penuh soal legalitas mendistribusikan hasil terjemahan ada di tangan penggunanya.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

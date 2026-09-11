# Simple Game Translator

Alat lokal untuk menerjemahkan teks dalam game buatan RPG Maker MV/MZ ke Bahasa Indonesia, langsung dari browser, tanpa upload file ke server manapun. Semua pembacaan dan penulisan file terjadi di komputer kamu sendiri.

## Kenapa alat ini ada

Script auto-translate untuk RPG Maker biasanya berupa satu file CLI yang cuma jalan di terminal, tanpa progress yang jelas, dan API key sering nempel di kode. Alat ini membungkus logika yang sama jadi antarmuka web lokal: kamu lihat progress-nya, pilih provider terjemahan sendiri, dan API key tidak pernah ikut ter-commit ke mana-mana.

## Menjalankan

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
npm install
cp config.example.js config.js   # opsional — isi API key default di sini
npm start
```

Buka `http://localhost:4173` di browser.

Panduan lebih lengkap ada di [`docs/installation.md`](./docs/installation.md).

## Cara pakai

1. Taruh project game kamu (folder yang berisi `data/` atau `www/data/`) ke dalam folder `games/`.
2. Pilih foldernya dari dropdown di web, klik **Baca folder**.
3. Pilih penyedia terjemahan. Kalau `config.js` sudah diisi, API key otomatis terisi — kalau belum, isi manual lalu klik **Tes koneksi**.
4. Klik **Mulai terjemahkan**. Progress per file dan per baris teks muncul langsung di panel log.
5. Hasil terjemahan disimpan sebagai folder baru bernama `<folder-asli>_indo` di dalam `games/`, sejajar dengan folder aslinya. Folder asli tidak pernah diubah.

Web ini hanya bisa membaca folder yang ada di dalam `games/` — tidak ada input path bebas, jadi tidak akan mengakses bagian lain dari komputer kamu.

## Provider yang didukung

- **DeepL** — butuh API key dari [deepl.com](https://www.deepl.com/pro-api), tier gratis tersedia.
- **Google Translate** — tanpa API key, memakai endpoint publik, cocok untuk uji coba cepat.
- **OpenAI-compatible** — untuk OpenAI, OpenRouter, atau server lokal seperti LM Studio/Ollama yang punya endpoint `/chat/completions`. Isi base URL dan nama model sendiri.

Untuk teks berbahasa Jepang, aktifkan opsi estafet: game diterjemahkan JA → EN → ID karena kualitasnya umumnya lebih stabil dibanding JA → ID langsung.

## Struktur proyek

```
server/
  core/           orkestrasi translate, cache, job runner, config, scoping folder games/
  engines/        logika khusus per game engine (rpgmaker/ saat ini)
  providers/      integrasi tiap penyedia terjemahan
  routes.js       endpoint API
  index.js        entry point server
public/           antarmuka web (HTML/CSS/JS polos, tanpa build step)
docs/             panduan instalasi dan kontribusi
games/            taruh project game di sini (di-gitignore, tidak ikut ter-commit)
config.example.js template konfigurasi — salin jadi config.js untuk API key default
```

Panduan menambah engine atau provider baru ada di [`docs/contributor.md`](./docs/contributor.md).

## Batasan yang perlu diketahui

- Cache terjemahan disimpan per kombinasi engine/bahasa/provider di `.cache/`, biar menjalankan ulang tidak menerjemahkan ulang teks yang sama.
- Placeholder escape code RPG Maker (`\C[1]`, `\N[1]`, dan sejenisnya) dilindungi otomatis sebelum dikirim ke provider, lalu dikembalikan setelah hasil terjemahan diterima.
- Alat ini tidak memvalidasi lisensi RTP/asset game. Tanggung jawab penuh soal legalitas mendistribusikan hasil terjemahan ada di tangan penggunanya.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

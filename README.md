# Simple Game Translator

Alat lokal untuk menerjemahkan teks dalam game buatan RPG Maker MV/MZ ke Bahasa Indonesia, langsung dari browser, tanpa upload file ke server manapun. Semua pembacaan dan penulisan file terjadi di komputer kamu sendiri.

## Kenapa alat ini ada

Script auto-translate untuk RPG Maker biasanya berupa satu file CLI yang cuma jalan di terminal, tanpa progress yang jelas, dan API key sering nempel di kode. Alat ini membungkus logika yang sama jadi antarmuka web lokal: kamu lihat progress-nya, pilih provider terjemahan sendiri, dan API key tidak pernah ikut ter-commit ke mana-mana.

## Menjalankan

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
npm install
npm start
```

Buka `http://localhost:4173` di browser.

## Cara pakai

1. Isi path folder project game kamu (folder yang berisi `data/` atau `www/data/`), lalu klik **Baca folder**.
2. Pilih penyedia terjemahan dan isi API key milikmu sendiri (klik **Tes koneksi** untuk memastikan key valid).
3. Klik **Mulai terjemahkan**. Progress per file dan per baris teks muncul langsung di panel log.
4. Hasil terjemahan disimpan sebagai folder baru bernama `<folder-asli>_indo`, sejajar dengan folder aslinya. Folder asli tidak pernah diubah.

## Provider yang didukung

- **DeepL** — butuh API key dari [deepl.com](https://www.deepl.com/pro-api), tier gratis tersedia.
- **Google Translate** — tanpa API key, memakai endpoint publik, cocok untuk uji coba cepat.
- **OpenAI-compatible** — untuk OpenAI, OpenRouter, atau server lokal seperti LM Studio/Ollama yang punya endpoint `/chat/completions`. Isi base URL dan nama model sendiri.

Untuk teks berbahasa Jepang, aktifkan opsi estafet: game diterjemahkan JA → EN → ID karena kualitasnya umumnya lebih stabil dibanding JA → ID langsung.

## Menambah engine game lain

Engine didefinisikan di `server/engines/`. Setiap engine adalah modul dengan empat bagian: `detect(folderPath)` untuk mengenali jenis project, `listSourceFiles(folderPath)` untuk daftar file yang perlu diproses, dan `translateFile(file, translateOne, options)` untuk menerjemahkan satu file. Daftarkan engine baru di `server/engines/registry.js`. Dukungan Ren'Py dan engine lain direncanakan mengikuti pola yang sama.

## Struktur proyek

```
server/
  core/           orkestrasi translate, cache, job runner
  engines/        logika khusus per game engine (rpgmaker/ saat ini)
  providers/      integrasi tiap penyedia terjemahan
  routes.js       endpoint API
  index.js        entry point server
public/           antarmuka web (HTML/CSS/JS polos, tanpa build step)
```

## Batasan yang perlu diketahui

- Cache terjemahan disimpan per kombinasi engine/bahasa/provider di `.cache/`, biar menjalankan ulang tidak menerjemahkan ulang teks yang sama.
- Placeholder escape code RPG Maker (`\C[1]`, `\N[1]`, dan sejenisnya) dilindungi otomatis sebelum dikirim ke provider, lalu dikembalikan setelah hasil terjemahan diterima.
- Alat ini tidak memvalidasi lisensi RTP/asset game. Tanggung jawab penuh soal legalitas mendistribusikan hasil terjemahan ada di tangan penggunanya.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

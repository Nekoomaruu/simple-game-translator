<div align="center">

# Simple Game Translator

**Alat lokal untuk menerjemahkan game ke Bahasa Indonesia — jalan di browser, baca-tulis file langsung dari komputer kamu, tanpa upload ke server manapun.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)
[![Local First](https://img.shields.io/badge/data-100%25%20lokal-2f855a?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg?style=flat-square)](./docs/contributor.md)

</div>

---

## Kenapa alat ini ada

Script auto-translate untuk RPG Maker biasanya berupa satu file CLI yang cuma jalan di terminal, tanpa progress yang jelas, dan API key sering nempel di kode. Alat ini membungkus logika yang sama jadi dashboard web lokal: kamu lihat progress-nya, pilih provider terjemahan sendiri, dan bisa merevisi hasil terjemahan yang kaku tanpa buka text editor manual.

## Engine yang didukung

<table>
<tr>
<td width="72" align="center">
<img src="https://img.shields.io/badge/RPG_Maker-MV%2FMZ-cd2456?style=for-the-badge" alt="RPG Maker MV/MZ" width="64"><br>
</td>
<td>

**RPG Maker MV/MZ**
Baca `data/*.json` (dan `www/data/*.json` kalau ada dua-duanya), plus `plugins.js`. Escape code (`\C[1]`, `\N[1]`, dst) dilindungi otomatis.

</td>
</tr>
<tr>
<td width="72" align="center">
<img src="https://cdn.simpleicons.org/renpy/FF7F7F" alt="Ren'Py" width="48">
</td>
<td>

**Ren'Py**
Baca `.rpy` di `game/tl/<bahasa>/` — mendukung dialog cerita maupun string UI/menu (`old`/`new`). Nama karakter dan elemen `{tag}`/`[variabel]` dilindungi otomatis. Mendukung banyak folder bahasa sekaligus (misal menimpa `en/` langsung, bukan cuma bikin folder baru).

</td>
</tr>
</table>

> Arsitektur engine bersifat pluggable — lihat [`docs/contributor.md`](./docs/contributor.md) untuk cara menambah engine lain.

## Provider terjemahan yang didukung

| Provider | Butuh API key | Catatan |
|---|---|---|
| ![DeepL](https://img.shields.io/badge/DeepL-0F2B46?style=flat-square&logo=deepl&logoColor=white) | Ya (ada tier gratis) | Dashboard bisa cek karakter terpakai & limit bulanan langsung dari akun kamu |
| ![Google Translate](https://img.shields.io/badge/Google_Translate-4285F4?style=flat-square&logo=googletranslate&logoColor=white) | Tidak | Endpoint publik, cocok untuk uji coba cepat |
| ![OpenAI](https://img.shields.io/badge/OpenAI--compatible-412991?style=flat-square&logo=openai&logoColor=white) | Ya | OpenAI, OpenRouter, atau server lokal (LM Studio/Ollama) — isi base URL & model sendiri |

Untuk teks berbahasa Jepang, aktifkan opsi estafet di Dashboard: game diterjemahkan JA → EN → ID karena kualitasnya umumnya lebih stabil dibanding JA → ID langsung.

## Menjalankan

Butuh [Node.js](https://nodejs.org) versi 18 ke atas.

```bash
npm install
npm start
```

Buka `http://localhost:4173` di browser.

Panduan instalasi lengkap ada di [`docs/installation.md`](./docs/installation.md).

## Cara pakai

Aplikasi punya tiga menu di sidebar:

### 📊 Dashboard
Atur provider terjemahan, API key, bahasa sumber default, dan lihat pemakaian kuota. Semua pengaturan ini disimpan di **localStorage browser kamu**, bukan di server atau file — jadi tidak pernah ke-commit ke git secara tidak sengaja, tapi juga berarti tidak ikut pindah kalau ganti browser/device.

### 🔄 Translate
Taruh project game kamu ke dalam folder `games/`, pilih dari dropdown, klik **Baca folder**, lalu **Mulai terjemahkan**. Progress per file dan per baris teks muncul real-time. Hasil disimpan sebagai folder baru `<folder-asli>_indo` di dalam `games/`, sejajar dengan folder aslinya — folder asli tidak pernah diubah.

### ✏️ Manual Revisi
Mesin terjemahan (apalagi yang murah/gratis) sering menghasilkan teks yang kaku, baku, atau salah konteks untuk dialog game. Menu ini membaca file hasil terjemahan di `<folder>_indo/` (JSON untuk RPG Maker, `.rpy` untuk Ren'Py), menampilkan tiap baris teks sebagai kotak yang bisa diedit langsung, dan menyimpannya balik ke file aslinya begitu kamu klik **Simpan perubahan** — nama karakter dan elemen `{tag}`/`[variabel]` di file Ren'Py tidak ikut ditampilkan untuk diedit, hanya teks dialognya.

> Web ini hanya bisa membaca folder yang ada di dalam `games/` — tidak ada input path bebas, jadi tidak akan mengakses bagian lain dari komputer kamu.

## Struktur proyek

```
server/
  core/           orkestrasi translate, cache, job runner, scoping folder games/, editor revisi
  engines/        logika khusus per game engine
    rpgmaker/       implementasi RPG Maker MV/MZ
    renpy/          implementasi Ren'Py
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
- Manual Revisi membaca dan menulis langsung ke file di folder `_indo/` — tidak ada undo di dalam aplikasi, jadi kalau mau aman, backup folder itu sebelum revisi besar-besaran.
- Untuk Ren'Py: baris dengan lebih dari satu string per baris dan blok `menu:` (pilihan bercabang) belum ditangani. Elemen berupa gambar (mis. judul/disclaimer yang di-render sebagai PNG) di luar jangkauan tool ini sama sekali — perlu diedit manual lewat image editor.
- Alat ini tidak memvalidasi lisensi RTP/asset game. Tanggung jawab penuh soal legalitas mendistribusikan hasil terjemahan ada di tangan penggunanya.

## Lisensi

MIT — lihat [LICENSE](./LICENSE).

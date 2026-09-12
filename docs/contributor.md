# Berkontribusi

Terima kasih sudah tertarik mengembangkan Simple Game Translator. Dokumen ini menjelaskan struktur kode dan cara menambah fitur, terutama engine game baru.

## Setup pengembangan

```bash
npm install
npm run dev
```

`npm run dev` memakai `node --watch`, jadi server otomatis restart setiap ada perubahan file di `server/`.

## Struktur proyek

```
server/
  core/           orkestrasi lintas-engine: cache, job runner, scoping folder games/, editor revisi
  engines/        logika khusus per game engine
    registry.js   daftar semua engine yang aktif
    rpgmaker/     implementasi untuk RPG Maker MV/MZ
    renpy/        implementasi untuk Ren'Py
  providers/      integrasi tiap penyedia terjemahan
    registry.js   daftar semua provider yang aktif
  routes.js       seluruh endpoint API
  index.js        entry point server
public/           antarmuka web — HTML/CSS/JS polos, sengaja tanpa build step/bundler
docs/             dokumentasi
games/            tempat pengguna menaruh project game (di-gitignore)
```

## Prinsip desain kode

- **Tanpa komentar yang menjelaskan hal yang sudah jelas dari kode itu sendiri.** Komentar hanya untuk *kenapa*, bukan *apa* — misalnya kenapa suatu heuristik dipilih, bukan mengulang nama fungsi dalam kalimat.
- **Penamaan spesifik ke domain.** Hindari nama generic seperti `data`, `item`, `handler`, `process()`. Nama fungsi/variabel harus langsung menjelaskan perannya dalam konteks RPG Maker/translasi, misalnya `isTranslatableField`, `restoreCodes`.
- **Tidak ada abstraksi yang belum dibutuhkan.** Jangan bikin factory/interface/class tambahan kalau baru dipakai satu kali. Tambahkan abstraksi saat kebutuhannya sudah nyata, bukan diantisipasi.
- **Modul kecil, satu tanggung jawab.** Lihat `server/engines/rpgmaker/` sebagai contoh: filter teks, escape code, word-wrap, dan event-list processing masing-masing file terpisah, bukan digabung jadi satu file besar.

## Menambah engine game baru

Setiap engine adalah folder di `server/engines/<nama-engine>/` dengan `index.js` yang mengekspor:

```js
module.exports = {
  id: 'nama-engine',           // dipakai sebagai identifier internal
  label: 'Nama yang ditampilkan di UI',

  detect(projectRoot) {
    // return true/false — apakah folder ini project dari engine ini
  },

  listSourceFiles(projectRoot) {
    // return array of { relativePath, absolutePath, ...metadata }
  },

  async translateFile(file, translateOne, options) {
    // baca file, terjemahkan field yang relevan lewat translateOne(text),
    // return isi file baru sebagai string siap ditulis
  }
};
```

`translateOne` adalah fungsi yang disuntikkan oleh job runner — sudah menangani cache, retry, dan proteksi placeholder secara umum lewat `translateString.js`. Proteksi yang spesifik ke sintaks satu engine (misalnya escape code RPG Maker atau text tag Ren'Py) tetap jadi tanggung jawab modul engine itu sendiri — lihat `engines/rpgmaker/escapeCodes.js` dan `engines/renpy/tokenProtection.js` sebagai referensi pola yang dipakai (protect sebelum translate, restore sesudahnya, pakai placeholder ASCII yang tidak mungkin ikut diterjemahkan).

Setelah modul engine siap, daftarkan di `server/engines/registry.js` — ini juga contoh nyata yang sudah berjalan di repo:

```js
const rpgMakerEngine = require('./rpgmaker');
const renpyEngine = require('./renpy');

const ENGINES = [rpgMakerEngine, renpyEngine];
```

Tidak perlu mengubah kode di `routes.js`, `translationJob.js`, atau provider — semuanya sudah bekerja lewat interface generik di atas.

## Menambah provider terjemahan baru

Buat file di `server/providers/`, turunkan dari `TranslationProvider` (`server/providers/base.js`), implementasikan `translate(text, sourceLang, targetLang)` dan `verify()`. Daftarkan di `server/providers/registry.js` dengan menyebutkan apakah provider butuh `apiKey`, `baseUrl`, dan/atau `model`.

## Pengujian manual sebelum mengirim perubahan

Karena proyek ini belum memiliki test suite otomatis, sebelum membuka pull request:

1. Pastikan `node --check` lolos untuk setiap file yang diubah.
2. Uji dengan project RPG Maker kecil (bisa buat folder tiruan dengan beberapa file `data/*.json` sederhana) untuk memastikan `detect`, `listSourceFiles`, dan `translateFile` bekerja sesuai ekspektasi.
3. Jalankan proses translate penuh lewat UI setidaknya sekali dengan provider Google Translate (tidak butuh API key) untuk memverifikasi alur end-to-end.

## Gaya commit dan pull request

- Satu pull request untuk satu perubahan yang jelas cakupannya (satu engine baru, satu bugfix, dll).
- Jelaskan di deskripsi PR: apa yang berubah, kenapa, dan bagaimana cara mengujinya.
- Kalau menambah engine atau provider baru, sertakan juga pembaruan di `README.md` dan `docs/installation.md` bila relevan.

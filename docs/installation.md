# Instalasi

## Kebutuhan

- [Node.js](https://nodejs.org) versi 18 ke atas. Cek versi yang terpasang dengan:

  ```bash
  node --version
  ```

## Langkah instalasi

1. **Clone atau ekstrak repo ini**, lalu masuk ke foldernya:

   ```bash
   cd simple-game-translator
   ```

2. **Install dependency**:

   ```bash
   npm install
   ```

3. **Taruh project game** yang mau diterjemahkan ke dalam folder `games/`. Dua jenis game didukung:

   **RPG Maker MV/MZ** — contoh struktur:

   ```
   simple-game-translator/
     games/
       NamaGameku/
         data/
           Actors.json
           Map001.json
           ...
         js/
           plugins.js
   ```

   Folder `games/NamaGameku` harus berisi folder `data/` (atau `www/data/`) khas RPG Maker MV/MZ.

   **Ren'Py** — ada dua cara dapat folder `game/tl/<bahasa>/` yang tool ini baca, tergantung apa yang kamu punya:

   - **Kalau kamu punya project source lengkap** (bukan cuma versi build/release): buka di Ren'Py Launcher, pilih **Generate Translations**, isi nama bahasa (bebas, mis. `indonesian`), lalu copy seluruh project ke `games/`.
   - **Kalau game cuma menyertakan file `.rpyc`** (terkompilasi, tanpa source `.rpy`) — ini umum buat game yang sudah di-build/release: decompile dulu `.rpyc` ke `.rpy` pakai tool seperti [unrpyc](https://github.com/CensoredUsername/unrpyc) atau web converter sejenis, lalu **timpa langsung ke folder bahasa yang sudah ada** (mis. `game/tl/en/`) — tidak perlu bikin folder baru. Beberapa web converter menambahkan baris penanda aneh (mis. `/unrpyc`) di akhir file hasil convert; hapus baris itu kalau game menolak jalan dengan pesan "expected statement".

   ```
   simple-game-translator/
     games/
       NamaVisualNovel/
         game/
           tl/
             indonesian/        <- atau nama folder bahasa apa saja, termasuk "en"
               script.rpy
               screens.rpy
               ...
   ```

   Simple Game Translator **tidak bisa membuat folder bahasa ini dari nol** — dia cuma mengisi baris terjemahan di dalam file `.rpy` yang sudah ada strukturnya. Kalau project punya lebih dari satu folder bahasa (misalnya `en/` dan `indonesian/` berdampingan), tool ini akan menampilkan pilihan folder mana yang mau diproses saat kamu klik **Baca folder** di menu Translate.

   Boleh taruh beberapa project game sekaligus (campur RPG Maker dan Ren'Py juga boleh), masing-masing di subfolder sendiri di dalam `games/`.

4. **Jalankan server**:

   ```bash
   npm start
   ```

5. Buka `http://localhost:4173` di browser.

## Alur pemakaian

### 1. Dashboard — atur provider dan API key

Menu pertama yang perlu diisi. Pilih provider terjemahan, isi API key (kalau providernya butuh), lalu klik **Tes koneksi** untuk memastikan key valid. Semua pengaturan ini tersimpan otomatis di localStorage browser — tidak perlu diisi ulang tiap buka aplikasi, tapi juga berarti tidak ikut pindah kalau kamu ganti browser atau device.

Untuk DeepL, tombol **Cek kuota** mengambil data karakter terpakai dan limit bulanan langsung dari akun kamu. Untuk OpenAI-compatible, jumlah token yang dipakai selama sesi translate terakumulasi otomatis di bagian "Pemakaian sesi ini" — angka ini reset tiap reload halaman karena tidak disimpan permanen.

### 2. Translate — jalankan penerjemahan

1. Pilih folder game dari dropdown, klik **Baca folder**.
2. Untuk project Ren'Py yang punya lebih dari satu folder bahasa (mis. `en/` dan `indonesian/`), dropdown tambahan "Folder bahasa" muncul otomatis — pilih folder mana yang mau diproses.
3. Pastikan provider yang aktif (ditampilkan di panel) sudah sesuai dengan yang diatur di Dashboard.
4. Klik **Mulai terjemahkan**. Progress per file dan per baris teks muncul real-time di panel log.
5. Hasil tersimpan di `games/NamaGameku_indo/`, sejajar dengan folder aslinya. Folder asli tidak diubah sama sekali — termasuk untuk Ren'Py, hasil terjemahan tetap masuk ke `NamaGameku_indo/game/tl/<bahasa yang dipilih>/`, bukan langsung menimpa game asli.

### 3. Manual Revisi — perbaiki hasil yang kaku

Mesin terjemahan otomatis (apalagi yang gratis) sering menghasilkan teks yang terlalu baku atau salah konteks untuk dialog game — semisal "MP" (Magic Point) yang malah diterjemahkan jadi "anggota parlemen". Menu ini untuk memperbaikinya tanpa perlu buka file manual (JSON untuk RPG Maker, `.rpy` untuk Ren'Py):

1. Pilih folder hasil terjemahan (yang berakhiran `_indo`) dari dropdown.
2. Pilih file yang mau direvisi.
3. Setiap baris teks tampil sebagai kotak yang bisa diedit langsung. Baris yang sudah diubah ditandai otomatis.
4. Klik **Simpan perubahan** untuk menulis balik ke file aslinya. Untuk file Ren'Py, baris komentar/sumber (yang jadi referensi Ren'Py) tidak pernah ikut berubah — hanya baris aktif yang dibaca game.

Tidak ada fitur undo di dalam aplikasi — kalau mau aman untuk revisi besar-besaran, backup dulu folder `_indo/` sebelum mulai.

## Menerapkan hasil terjemahan ke game

Setelah proses selesai (baik dari menu Translate maupun setelah direvisi manual), folder `NamaGameku_indo/` berisi **hanya file yang diterjemahkan** (`data/*.json`, dan `js/plugins.js` kalau ada) — bukan seluruh game. Untuk menerapkannya:

1. **Backup dulu** folder game asli sebelum menimpa apa pun — kalau ada yang salah, kamu masih punya versi asli.
2. Buka folder `NamaGameku_indo/`. Perhatikan strukturnya persis mengikuti posisi asli file tersebut di game — kalau game aslinya punya `www/data/`, hasil terjemahan juga akan ada di `NamaGameku_indo/www/data/`, bukan cuma `NamaGameku_indo/data/`.
3. **Copy isi folder tersebut, lalu timpa (overwrite) ke lokasi yang sama persis** di folder game asli. Jangan mengganti nama folder atau memindahkan ke level yang berbeda — file hasil terjemahan harus ada di path yang sama persis dengan sebelumnya, karena game membaca berdasarkan path tetap.
4. Jalankan **New Game**, bukan *Continue/Load*. RPG Maker menyimpan teks (nama karakter, dialog yang sudah tampil) ke dalam save file — save lama tidak akan otomatis menampilkan teks baru walau data game sudah diganti.
5. Kalau game sebelumnya sempat dijalankan dan masih menampilkan teks lama meski sudah New Game, tutup total prosesnya (lewat task manager, bukan cuma close window) lalu buka ulang — beberapa build NW.js sempat menyimpan cache di memori.

### Kalau game punya folder `data/` di dua tempat sekaligus

Beberapa game RPG Maker MV/MZ punya folder `data/` ganda: satu di root project, satu lagi di `www/data/`. Ini biasa terjadi karena sisa proses deploy/build. Simple Game Translator akan mendeteksi dan menerjemahkan **kedua-duanya** kalau memang ada — jadi kamu tidak perlu menebak folder mana yang benar-benar dipakai game; tinggal timpa semua yang ada di `NamaGameku_indo/` ke game asli.

### Menerapkan hasil terjemahan Ren'Py

Prosesnya lebih sederhana dibanding RPG Maker: hasil terjemahan ada di `NamaVisualNovel_indo/game/tl/<bahasa>/` (nama foldernya sesuai yang kamu pilih saat translate). Timpa isi folder itu ke `game/tl/<bahasa>/` yang sama di project asli. Kalau kamu timpa ke folder bahasa yang sudah ada (mis. `en/`), pastikan tidak ada file `.rpyc` lama yang masih tersisa berdampingan dengan `.rpy` baru — hapus dulu `.rpyc` lamanya supaya Ren'Py tidak salah pakai versi lama. Ren'Py otomatis compile ulang `.rpy` jadi `.rpyc` setiap game dijalankan, dan pemain tinggal pilih bahasa itu dari menu Preferences in-game — tidak perlu New Game khusus seperti RPG Maker, karena Ren'Py memuat ulang teks dari file translasi setiap kali bahasa diganti.

Satu hal yang di luar jangkauan tool ini: kalau ada teks yang berupa gambar (mis. tombol menu yang sebenarnya file PNG, bukan teks yang dirender dari kode), teks itu tidak akan pernah berubah lewat translasi `.rpy` — perlu diedit manual lewat image editor.

## Mengganti port

Jalankan dengan environment variable:

```bash
PORT=5000 npm start
```

## Troubleshooting

**Dropdown folder kosong di menu Translate** — pastikan project game benar-benar ada di dalam `games/`, bukan di folder lain, dan berisi subfolder `data/`.

**Dropdown folder kosong di menu Manual Revisi** — folder yang muncul di sini hanya yang sudah pernah diterjemahkan (nama folder mengandung `_indo`). Jalankan translate dulu dari menu Translate.

**"Tidak ada engine yang cocok dengan folder ini"** — RPG Maker MV/MZ (folder harus punya `data/*.json`) dan Ren'Py (folder harus punya minimal satu folder `game/tl/<bahasa>/*.rpy`, apapun nama bahasanya) yang didukung saat ini. Engine lain bisa ditambah — lihat [`docs/contributor.md`](./contributor.md).

**Folder Ren'Py tidak terdeteksi meski sudah ada `tl/<bahasa>/`** — pastikan folder itu berisi minimal satu file `.rpy` (bukan cuma `.rpyc`) dengan blok `translate <bahasa> ...:` di dalamnya. File `.rpyc` murni (tanpa `.rpy` pendamping) tidak bisa dibaca tool ini — perlu di-decompile dulu jadi `.rpy`.

**Game tetap bahasa lama setelah ditimpa** — kemungkinan besar ada file `.rpyc` versi lama yang masih tersisa berdampingan dengan `.rpy` baru di folder yang sama. Hapus `.rpyc` lama itu, karena Ren'Py bisa jadi tetap memakainya alih-alih compile ulang dari `.rpy`.

**Error "expected statement" saat game dijalankan setelah ditimpa** — kalau file `.rpy` didapat dari decompile pakai web converter, cek baris paling akhir file itu; beberapa converter menambahkan baris penanda (mis. `/unrpyc`) yang bukan sintaks Ren'Py valid. Hapus baris itu.

**DeepL menolak koneksi** — periksa apakah API key memakai akun Free (`:fx` di akhir key) atau Pro; keduanya didukung otomatis, tapi pastikan key belum kedaluwarsa atau kuota habis (cek lewat tombol **Cek kuota** di Dashboard).

**API key hilang setelah ganti browser/device** — ini memang perilaku yang disengaja. API key disimpan di localStorage browser, bukan di file config, supaya tidak ada risiko ke-commit ke git tanpa sengaja. Isi ulang lewat Dashboard.

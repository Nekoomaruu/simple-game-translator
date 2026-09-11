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

3. **Siapkan config** (opsional, tapi disarankan supaya tidak perlu isi API key berulang kali):

   ```bash
   cp config.example.js config.js
   ```

   Buka `config.js`, isi `apiKey` untuk provider yang mau dipakai sebagai default. File `config.js` sudah masuk `.gitignore`, jadi aman dari ke-commit tidak sengaja.

   Kalau langkah ini dilewati, aplikasi tetap jalan — kamu cuma perlu isi API key manual lewat form di web setiap kali dipakai.

4. **Taruh project game** yang mau diterjemahkan ke dalam folder `games/`. Contoh struktur:

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

   Folder `games/NamaGameku` harus berisi folder `data/` (atau `www/data/`) khas RPG Maker MV/MZ. Boleh taruh beberapa project game sekaligus, masing-masing di subfolder sendiri.

5. **Jalankan server**:

   ```bash
   npm start
   ```

6. Buka `http://localhost:4173` di browser. Folder yang tadi ditaruh di `games/` akan muncul otomatis di dropdown.

## Alur pemakaian singkat

1. Pilih folder game dari dropdown, klik **Baca folder**.
2. Pilih provider terjemahan. Kalau `config.js` sudah diisi, API key otomatis terisi.
3. Klik **Tes koneksi** untuk memastikan API key valid sebelum menjalankan proses penuh.
4. Klik **Mulai terjemahkan**. Progress muncul real-time di panel log sebelah kanan.
5. Hasil tersimpan di `games/NamaGameku_indo/`, sejajar dengan folder aslinya. Folder asli tidak diubah sama sekali.

## Menerapkan hasil terjemahan ke game

Setelah proses selesai, folder `NamaGameku_indo/` berisi **hanya file yang diterjemahkan** (`data/*.json`, dan `js/plugins.js` kalau ada) — bukan seluruh game. Untuk menerapkannya:

1. **Backup dulu** folder game asli sebelum menimpa apa pun — kalau ada yang salah, kamu masih punya versi asli.
2. Buka folder `NamaGameku_indo/`. Perhatikan strukturnya persis mengikuti posisi asli file tersebut di game — kalau game aslinya punya `www/data/`, hasil terjemahan juga akan ada di `NamaGameku_indo/www/data/`, bukan cuma `NamaGameku_indo/data/`.
3. **Copy isi folder tersebut, lalu timpa (overwrite) ke lokasi yang sama persis** di folder game asli. Jangan mengganti nama folder atau memindahkan ke level yang berbeda — file JSON harus ada di path yang sama persis dengan sebelumnya, karena game membaca berdasarkan path tetap.
4. Jalankan **New Game**, bukan *Continue/Load*. RPG Maker menyimpan teks (nama karakter, dialog yang sudah tampil) ke dalam save file — save lama tidak akan otomatis menampilkan teks baru walau data game sudah diganti.
5. Kalau game sebelumnya sempat dijalankan dan masih menampilkan teks lama meski sudah New Game, tutup total prosesnya (lewat task manager, bukan cuma close window) lalu buka ulang — beberapa build NW.js sempat menyimpan cache di memori.

### Kalau game punya folder `data/` di dua tempat sekaligus

Beberapa game RPG Maker MV/MZ punya folder `data/` ganda: satu di root project, satu lagi di `www/data/`. Ini biasa terjadi karena sisa proses deploy/build. Simple Game Translator akan mendeteksi dan menerjemahkan **kedua-duanya** kalau memang ada — jadi kamu tidak perlu menebak folder mana yang benar-benar dipakai game; tinggal timpa semua yang ada di `NamaGameku_indo/` ke game asli.



Ubah nilai `port` di `config.js`, atau jalankan dengan environment variable:

```bash
PORT=5000 npm start
```

## Troubleshooting

**Dropdown folder kosong** — pastikan project game benar-benar ada di dalam `games/`, bukan di folder lain, dan berisi subfolder `data/`.

**"Tidak ada engine yang cocok dengan folder ini"** — saat ini hanya RPG Maker MV/MZ yang didukung (folder harus punya `data/*.json`). Engine lain akan menyusul.

**DeepL menolak koneksi** — periksa apakah API key memakai akun Free (`:fx` di akhir key) atau Pro; keduanya didukung otomatis, tapi pastikan key belum kedaluwarsa atau kuota habis di dashboard DeepL.

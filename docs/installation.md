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

## Mengganti port

Ubah nilai `port` di `config.js`, atau jalankan dengan environment variable:

```bash
PORT=5000 npm start
```

## Troubleshooting

**Dropdown folder kosong** — pastikan project game benar-benar ada di dalam `games/`, bukan di folder lain, dan berisi subfolder `data/`.

**"Tidak ada engine yang cocok dengan folder ini"** — saat ini hanya RPG Maker MV/MZ yang didukung (folder harus punya `data/*.json`). Engine lain akan menyusul.

**DeepL menolak koneksi** — periksa apakah API key memakai akun Free (`:fx` di akhir key) atau Pro; keduanya didukung otomatis, tapi pastikan key belum kedaluwarsa atau kuota habis di dashboard DeepL.

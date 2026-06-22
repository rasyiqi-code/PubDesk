# Cloudflared Sidecar Binary

Folder ini digunakan untuk menempatkan binary `cloudflared.exe` yang akan di-bundle bersama aplikasi PubAdmin untuk fitur one-click Cloudflare Tunnel setup di Windows.

## Cara Menyiapkan

1. Download `cloudflared-windows-amd64.exe` dari:
   https://github.com/cloudflare/cloudflared/releases/latest

2. Rename menjadi `cloudflared-x86_64-pc-windows-msvc.exe`

3. Tempatkan file tersebut di folder ini.

4. File ini akan di-bundle sebagai sidecar oleh Tauri saat build Windows.

## Catatan Keamanan

- Jangan commit binary ini ke repository (sudah di-ignore di `.gitignore`).
- Tunnel token disediakan via environment variable `CLOUDFLARE_TUNNEL_TOKEN` saat build.
- Untuk development di Linux/Mac, fitur ini tidak aktif.

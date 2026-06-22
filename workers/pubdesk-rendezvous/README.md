# PubDesk Rendezvous Worker

Worker Cloudflare gratis untuk membantu peer PubDesk menemukan satu sama lain.

## Cara Deploy

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login:
   ```bash
   wrangler login
   ```

3. Buat KV namespace:
   ```bash
   wrangler kv:namespace create "PUBDESK_PEERS"
   wrangler kv:namespace create "PUBDESK_PEERS" --preview
   ```

4. Update `wrangler.toml` dengan ID yang diberikan.

5. Deploy:
   ```bash
   wrangler deploy
   ```

6. Copy URL Worker (contoh: `https://pubdesk-rendezvous.your-account.workers.dev`) ke konfigurasi aplikasi PubDesk.

## Endpoint

- `POST /register`
  ```json
  {
    "workspace_id": "abc123",
    "peer_id": "12D3KooW...",
    "addresses": ["/ip4/192.168.1.10/tcp/12345"]
  }
  ```

- `GET /peers/:workspace_id`
  Response: array of peer records.

## Catatan

- Data yang lewat Worker hanya metadata peer (peer_id + alamat). Data bisnis tetap di-encrypt end-to-end dan dikirim melalui jaringan P2P libp2p.
- Entry peer expired setelah 5 menit. Aplikasi client akan re-register secara berkala saat online.

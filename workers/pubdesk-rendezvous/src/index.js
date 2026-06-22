/**
 * PubDesk Rendezvous Worker
 *
 * Cloudflare Worker free-tier compatible. Only handles lightweight peer
 * discovery metadata. Actual sync data never passes through this Worker;
 * it travels encrypted via libp2p gossipsub / relay.
 *
 * Endpoints:
 *   POST /register
 *     { workspace_id, peer_id, addresses: ["/ip4/..."] }
 *   GET  /peers/:workspace_id
 *     -> [{ peer_id, addresses, ts }]
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/register" && request.method === "POST") {
        const body = await request.json();
        const workspace_id = String(body.workspace_id || "");
        const peer_id = String(body.peer_id || "");
        const addresses = Array.isArray(body.addresses) ? body.addresses : [];

        if (!workspace_id || !peer_id) {
          return new Response(
            JSON.stringify({ error: "workspace_id and peer_id required" }),
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const key = `peers:${workspace_id}:${peer_id}`;
        const value = JSON.stringify({
          peer_id,
          addresses,
          ts: Date.now(),
        });

        // TTL 5 minutes. Peers are expected to re-register while online.
        await env.PUBDESK_PEERS.put(key, value, { expirationTtl: 300 });

        return new Response(JSON.stringify({ ok: true }), {
          headers: CORS_HEADERS,
        });
      }

      if (url.pathname.startsWith("/peers/")) {
        const parts = url.pathname.split("/");
        const workspace_id = parts[2];
        if (!workspace_id) {
          return new Response(
            JSON.stringify({ error: "workspace_id required" }),
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const list = await env.PUBDESK_PEERS.list({
          prefix: `peers:${workspace_id}:`,
        });

        const peers = [];
        for (const key of list.keys) {
          const raw = await env.PUBDESK_PEERS.get(key.name);
          if (raw) {
            try {
              peers.push(JSON.parse(raw));
            } catch {
              // ignore corrupted entry
            }
          }
        }

        return new Response(JSON.stringify(peers), { headers: CORS_HEADERS });
      }

      return new Response(JSON.stringify({ ok: true, usage: "/register or /peers/:workspace_id" }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
};

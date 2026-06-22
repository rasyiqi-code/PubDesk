use std::error::Error;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use futures::{prelude::*, select};
use libp2p::{
    identity,
    noise,
    request_response,
    swarm::SwarmEvent,
    tcp,
    yamux,
    Multiaddr,
    PeerId,
    SwarmBuilder,
};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, oneshot};

// Model Request-Response P2P untuk kueri SQL
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PRequest {
    Query { sql: String, params_json: String, token: String },
    Execute { sql: String, params_json: String, token: String },
    Ping { token: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PResponse {
    QueryResult {
        columns: Vec<String>,
        rows: Vec<Vec<serde_json::Value>>,
    },
    ExecuteResult {
        rows_affected: usize,
        last_insert_rowid: i64,
    },
    Pong,
    Error(String),
}

// Crate codec JSON sederhana untuk libp2p Request-Response
#[derive(Clone, Default)]
pub struct JsonCodec;

#[async_trait::async_trait]
impl request_response::Codec for JsonCodec {
    type Protocol = &'static str;
    type Request = P2PRequest;
    type Response = P2PResponse;

    async fn read_request<T>(
        &mut self,
        protocol: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut vec = Vec::new();
        let _ = protocol;
        io.read_to_end(&mut vec).await?;
        serde_json::from_slice(&vec).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    async fn read_response<T>(
        &mut self,
        protocol: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        let mut vec = Vec::new();
        let _ = protocol;
        io.read_to_end(&mut vec).await?;
        serde_json::from_slice(&vec).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    async fn write_request<T>(
        &mut self,
        protocol: &Self::Protocol,
        io: &mut T,
        req: Self::Request,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        let _ = protocol;
        let vec = serde_json::to_vec(&req).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
        io.write_all(&vec).await?;
        io.close().await?;
        Ok(())
    }

    async fn write_response<T>(
        &mut self,
        protocol: &Self::Protocol,
        io: &mut T,
        res: Self::Response,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        let _ = protocol;
        let vec = serde_json::to_vec(&res).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
        io.write_all(&vec).await?;
        io.close().await?;
        Ok(())
    }
}

// Perintah internal ke background loop libp2p
pub enum P2PCommand {
    StartListening {
        sender: oneshot::Sender<Result<Multiaddr, String>>,
    },
    Dial {
        addr: Multiaddr,
        sender: oneshot::Sender<Result<(), String>>,
    },
    SendRequest {
        peer_id: PeerId,
        request: P2PRequest,
        sender: oneshot::Sender<Result<P2PResponse, String>>,
    },
    GetConnectionStatus {
        sender: oneshot::Sender<P2PStatus>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct P2PStatus {
    pub is_connected: bool,
    pub peer_id: String,
    pub active_peers: Vec<String>,
    pub local_addresses: Vec<String>,
}

// Manager utama untuk P2P
pub struct P2PManager {
    cmd_tx: mpsc::Sender<P2PCommand>,
    pub peer_id: PeerId,
}

impl P2PManager {
    pub fn new(
        keypair_bytes: Vec<u8>,
        db_conn_provider: Arc<Mutex<Option<rusqlite::Connection>>>,
    ) -> Result<Self, Box<dyn Error>> {
        // Load keypair dari bytes yang tersimpan
        let id_keys = identity::Keypair::from_protobuf_encoding(&keypair_bytes)?;
        let peer_id = id_keys.public().to_peer_id();
        
        let (cmd_tx, cmd_rx) = mpsc::channel(100);

        // Spawn background tokio task
        tokio::spawn(async move {
            if let Err(e) = run_p2p_loop(id_keys, cmd_rx, db_conn_provider).await {
                println!("Error in P2P background loop: {:?}", e);
            }
        });

        Ok(Self { cmd_tx, peer_id })
    }

    pub async fn start_listening(&self) -> Result<Multiaddr, String> {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(P2PCommand::StartListening { sender: tx }).await;
        rx.await.map_err(|_| "Background task channel closed".to_string())?
    }

    pub async fn dial(&self, addr: Multiaddr) -> Result<(), String> {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(P2PCommand::Dial { addr, sender: tx }).await;
        rx.await.map_err(|_| "Background task channel closed".to_string())?
    }

    pub async fn send_query(&self, peer_id: PeerId, sql: String, params_json: String, token: String) -> Result<P2PResponse, String> {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(P2PCommand::SendRequest {
            peer_id,
            request: P2PRequest::Query { sql, params_json, token },
            sender: tx,
        }).await;
        rx.await.map_err(|_| "Background task channel closed".to_string())?
    }

    pub async fn send_execute(&self, peer_id: PeerId, sql: String, params_json: String, token: String) -> Result<P2PResponse, String> {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(P2PCommand::SendRequest {
            peer_id,
            request: P2PRequest::Execute { sql, params_json, token },
            sender: tx,
        }).await;
        rx.await.map_err(|_| "Background task channel closed".to_string())?
    }

    pub async fn get_status(&self) -> Result<P2PStatus, String> {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(P2PCommand::GetConnectionStatus { sender: tx }).await;
        rx.await.map_err(|_| "Background task channel closed".to_string())
    }
}

// Background Swarm loop
async fn run_p2p_loop(
    id_keys: identity::Keypair,
    mut cmd_rx: mpsc::Receiver<P2PCommand>,
    db_conn_provider: Arc<Mutex<Option<rusqlite::Connection>>>,
) -> Result<(), Box<dyn Error>> {
    let local_peer_id = id_keys.public().to_peer_id();

    // Setup network behaviour
    let behaviour = request_response::Behaviour::with_codec(
        JsonCodec,
        std::iter::once((
            "/pubhub/db/1.0.0",
            request_response::ProtocolSupport::Full,
        )),
        request_response::Config::default(),
    );

    // Build the swarm
    let mut swarm = SwarmBuilder::with_existing_identity(id_keys)
        .with_tokio()
        .with_tcp(
            tcp::Config::default(),
            noise::Config::new,
            yamux::Config::default,
        )?
        .with_behaviour(|_| behaviour)?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(60)))
        .build();

    let mut pending_dials = std::collections::HashMap::new();
    let mut pending_requests = std::collections::HashMap::new();
    let mut local_addresses = Vec::new();
    let mut active_peers = std::collections::HashSet::new();

    loop {
        select! {
            cmd = cmd_rx.recv().fuse() => {
                match cmd {
                    Some(P2PCommand::StartListening { sender }) => {
                        // Dengarkan di port acak (TCP)
                        match swarm.listen_on("/ip4/0.0.0.0/tcp/0".parse()?) {
                            Ok(_listener_id) => {
                                // Tunggu sebentar sampai Multiaddress didaftarkan
                                let _ = sender.send(Ok(Multiaddr::empty())); // return dummy, real addr will be populated on SwarmEvent
                            }
                            Err(e) => {
                                let _ = sender.send(Err(e.to_string()));
                            }
                        }
                    }
                    Some(P2PCommand::Dial { addr, sender }) => {
                        match swarm.dial(addr.clone()) {
                            Ok(_) => {
                                // Simpan sender untuk dikembalikan setelah terkoneksi
                                if let Some(peer_id) = addr.iter().find_map(|p| match p {
                                    libp2p::multiaddr::Protocol::P2p(peer_id) => Some(peer_id),
                                    _ => None
                                }) {
                                    pending_dials.insert(peer_id, sender);
                                } else {
                                    let _ = sender.send(Ok(()));
                                }
                            }
                            Err(e) => {
                                let _ = sender.send(Err(e.to_string()));
                            }
                        }
                    }
                    Some(P2PCommand::SendRequest { peer_id, request, sender }) => {
                        let request_id = swarm.behaviour_mut().send_request(&peer_id, request);
                        pending_requests.insert(request_id, sender);
                    }
                    Some(P2PCommand::GetConnectionStatus { sender }) => {
                        let status = P2PStatus {
                            is_connected: !active_peers.is_empty(),
                            peer_id: local_peer_id.to_string(),
                            active_peers: active_peers.iter().map(|p: &PeerId| p.to_string()).collect(),
                            local_addresses: local_addresses.iter().map(|a: &Multiaddr| a.to_string()).collect(),
                        };
                        let _ = sender.send(status);
                    }
                    None => break,
                }
            }
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        local_addresses.push(address.clone());
                    }
                    SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                        active_peers.insert(peer_id);
                        if let Some(sender) = pending_dials.remove(&peer_id) {
                            let _ = sender.send(Ok(()));
                        }
                    }
                    SwarmEvent::ConnectionClosed { peer_id, .. } => {
                        active_peers.remove(&peer_id);
                    }
                    SwarmEvent::OutgoingConnectionError { peer_id, error, .. } => {
                        if let Some(peer_id) = peer_id {
                            if let Some(sender) = pending_dials.remove(&peer_id) {
                                let _ = sender.send(Err(error.to_string()));
                            }
                        }
                    }
                    SwarmEvent::Behaviour(request_response::Event::Message { message, .. }) => {
                        match message {
                            request_response::Message::Request { request, channel, .. } => {
                                // Eksekusi request SQL secara lokal
                                let response = handle_incoming_request(request, &db_conn_provider);
                                let _ = swarm.behaviour_mut().send_response(channel, response);
                            }
                            request_response::Message::Response { request_id, response, .. } => {
                                if let Some(sender) = pending_requests.remove(&request_id) {
                                    let _ = sender.send(Ok(response));
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(())
}

// Penanganan query SQL di host
fn handle_incoming_request(
    request: P2PRequest,
    db_conn_provider: &Arc<Mutex<Option<rusqlite::Connection>>>,
) -> P2PResponse {
    let provider = db_conn_provider.lock().unwrap();
    let conn = match provider.as_ref() {
        Some(c) => c,
        None => return P2PResponse::Error("Database not initialized on host".to_string()),
    };

    // Validasi token
    let token = match &request {
        P2PRequest::Query { token, .. } => token,
        P2PRequest::Execute { token, .. } => token,
        P2PRequest::Ping { token } => token,
    };

    let expected_token = match conn.query_row(
        "SELECT value FROM p2p_config WHERE key = 'auth_token'",
        [],
        |row| row.get::<_, String>(0)
    ) {
        Ok(t) => t,
        Err(_) => "".to_string(),
    };

    if token != &expected_token {
        return P2PResponse::Error("Unauthorized: Token tidak cocok".to_string());
    }

    match request {
        P2PRequest::Query { sql, params_json, .. } => {
            let params: Vec<serde_json::Value> = match serde_json::from_str(&params_json) {
                Ok(p) => p,
                Err(e) => return P2PResponse::Error(format!("Invalid params format: {}", e)),
            };

            let mut stmt = match conn.prepare(&sql) {
                Ok(s) => s,
                Err(e) => return P2PResponse::Error(e.to_string()),
            };

            let column_count = stmt.column_count();
            let columns: Vec<String> = (0..column_count)
                .map(|i| stmt.column_name(i).unwrap_or("").to_string())
                .collect();

            // Ubah params ke format rusqlite params
            let rusqlite_params: Vec<Box<dyn rusqlite::types::ToSql>> = params
                .iter()
                .map(|v| -> Box<dyn rusqlite::types::ToSql> {
                    match v {
                        serde_json::Value::Null => Box::new(rusqlite::types::Null),
                        serde_json::Value::Bool(b) => Box::new(*b),
                        serde_json::Value::Number(n) => {
                            if let Some(i) = n.as_i64() {
                                Box::new(i)
                            } else if let Some(f) = n.as_f64() {
                                Box::new(f)
                            } else {
                                Box::new(rusqlite::types::Null)
                            }
                        }
                        serde_json::Value::String(s) => Box::new(s.clone()),
                        _ => Box::new(v.to_string()),
                    }
                })
                .collect();

            let params_slice: Vec<&dyn rusqlite::types::ToSql> = rusqlite_params
                .iter()
                .map(|p| p.as_ref())
                .collect();

            let rows_result = stmt.query_map(&params_slice[..], |row| {
                let mut row_values = Vec::new();
                for i in 0..column_count {
                    let value = row.get_ref(i)?;
                    let json_value = match value {
                        rusqlite::types::ValueRef::Null => serde_json::Value::Null,
                        rusqlite::types::ValueRef::Integer(i) => serde_json::Value::Number(i.into()),
                        rusqlite::types::ValueRef::Real(r) => serde_json::Value::Number(serde_json::Number::from_f64(r).unwrap()),
                        rusqlite::types::ValueRef::Text(t) => {
                            let text = std::str::from_utf8(t).unwrap_or("");
                            serde_json::Value::String(text.to_string())
                        }
                        rusqlite::types::ValueRef::Blob(b) => {
                            serde_json::Value::String(base64::Engine::encode(&base64::prelude::BASE64_STANDARD, b)) // fallback blob ke base64 string
                        }
                    };
                    row_values.push(json_value);
                }
                Ok(row_values)
            });

            match rows_result {
                Ok(mapped_rows) => {
                    let rows: Vec<Vec<serde_json::Value>> = mapped_rows.filter_map(|r| r.ok()).collect();
                    P2PResponse::QueryResult { columns, rows }
                }
                Err(e) => P2PResponse::Error(e.to_string()),
            }
        }
        P2PRequest::Execute { sql, params_json, .. } => {
            let params: Vec<serde_json::Value> = match serde_json::from_str(&params_json) {
                Ok(p) => p,
                Err(e) => return P2PResponse::Error(format!("Invalid params format: {}", e)),
            };

            let rusqlite_params: Vec<Box<dyn rusqlite::types::ToSql>> = params
                .iter()
                .map(|v| -> Box<dyn rusqlite::types::ToSql> {
                    match v {
                        serde_json::Value::Null => Box::new(rusqlite::types::Null),
                        serde_json::Value::Bool(b) => Box::new(*b),
                        serde_json::Value::Number(n) => {
                            if let Some(i) = n.as_i64() {
                                Box::new(i)
                            } else if let Some(f) = n.as_f64() {
                                Box::new(f)
                            } else {
                                Box::new(rusqlite::types::Null)
                            }
                        }
                        serde_json::Value::String(s) => Box::new(s.clone()),
                        _ => Box::new(v.to_string()),
                    }
                })
                .collect();

            let params_slice: Vec<&dyn rusqlite::types::ToSql> = rusqlite_params
                .iter()
                .map(|p| p.as_ref())
                .collect();

            match conn.execute(&sql, &params_slice[..]) {
                Ok(rows_affected) => P2PResponse::ExecuteResult {
                    rows_affected,
                    last_insert_rowid: conn.last_insert_rowid(),
                },
                Err(e) => P2PResponse::Error(e.to_string()),
            }
        }
        P2PRequest::Ping { .. } => P2PResponse::Pong,
    }
}

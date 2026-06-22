use std::collections::HashMap;
use std::time::Duration;
use futures::StreamExt;
use libp2p::{
    gossipsub, identify, mdns, ping, relay,
    swarm::{NetworkBehaviour, SwarmEvent},
    Multiaddr, PeerId, SwarmBuilder,
};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, oneshot};

use super::types::{PeerInfo, SyncEnvelope};

const DEFAULT_BOOTSTRAPS: &[&str] = &[
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbAwwibVdpu7eq",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcfgsJsMtx6qMm8ZaCcJDuaVZ6tw5GFKYa6A5DiN8rDvz",
];

pub const SOURCE_LAN: &str = "LAN / mDNS";
pub const SOURCE_CLOUDFLARE: &str = "Cloudflare Worker";
pub const SOURCE_RELAY: &str = "Internet Relay";
pub const SOURCE_INBOUND: &str = "Inbound / Unknown";

#[derive(Debug, Clone)]
pub enum NetworkEvent {
    EnvelopeReceived { peer_id: String, envelope: SyncEnvelope },
    PeerConnected(PeerInfo),
    PeerDisconnected(String),
}

pub enum NetworkCommand {
    StartListening {
        port: u16,
        sender: oneshot::Sender<Result<Vec<Multiaddr>, String>>,
    },
    Publish {
        workspace_id: String,
        payload_b64: String,
        sender: oneshot::Sender<Result<(), String>>,
    },
    Dial {
        addr: Multiaddr,
        source: String,
        sender: oneshot::Sender<Result<(), String>>,
    },
    GetStatus {
        sender: oneshot::Sender<NetworkStatus>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub peer_id: String,
    pub local_addresses: Vec<String>,
    pub connected_peers: Vec<PeerInfo>,
    pub subscribed_topics: Vec<String>,
}

#[derive(NetworkBehaviour)]
struct SyncBehaviour {
    gossipsub: gossipsub::Behaviour,
    mdns: mdns::tokio::Behaviour,
    identify: identify::Behaviour,
    ping: ping::Behaviour,
    relay: relay::Behaviour,
}

pub struct SyncNetwork {
    cmd_tx: mpsc::Sender<NetworkCommand>,
    pub peer_id: PeerId,
}

impl SyncNetwork {
    pub fn new(
        keypair_bytes: Vec<u8>,
        workspace_id: String,
    ) -> Result<(Self, mpsc::Receiver<NetworkEvent>), String> {
        let id_keys = libp2p::identity::Keypair::from_protobuf_encoding(&keypair_bytes)
            .map_err(|e| format!("Invalid keypair: {}", e))?;
        let peer_id = id_keys.public().to_peer_id();

        let (cmd_tx, cmd_rx) = mpsc::channel(100);
        let (event_tx, event_rx) = mpsc::channel(100);

        tokio::spawn(async move {
            if let Err(e) = run_network_loop(id_keys, workspace_id, cmd_rx, event_tx).await {
                eprintln!("Sync network loop error: {:?}", e);
            }
        });

        Ok((Self { cmd_tx, peer_id }, event_rx))
    }

    pub async fn start_listening(&self, port: u16) -> Result<Vec<Multiaddr>, String> {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .cmd_tx
            .send(NetworkCommand::StartListening { port, sender: tx })
            .await;
        rx.await.map_err(|_| "Network task closed".to_string())?
    }

    pub async fn publish(&self, workspace_id: String, payload_b64: String) -> Result<(), String> {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .cmd_tx
            .send(NetworkCommand::Publish {
                workspace_id,
                payload_b64,
                sender: tx,
            })
            .await;
        rx.await.map_err(|_| "Network task closed".to_string())?
    }

    pub async fn dial(&self, addr: Multiaddr, source: String) -> Result<(), String> {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .cmd_tx
            .send(NetworkCommand::Dial { addr, source, sender: tx })
            .await;
        rx.await.map_err(|_| "Network task closed".to_string())?
    }

    pub async fn status(&self) -> NetworkStatus {
        let (tx, rx) = oneshot::channel();
        let _ = self.cmd_tx.send(NetworkCommand::GetStatus { sender: tx }).await;
        rx.await.unwrap_or_else(|_| NetworkStatus {
            peer_id: self.peer_id.to_string(),
            local_addresses: vec![],
            connected_peers: vec![],
            subscribed_topics: vec![],
        })
    }
}

async fn run_network_loop(
    id_keys: libp2p::identity::Keypair,
    workspace_id: String,
    mut cmd_rx: mpsc::Receiver<NetworkCommand>,
    event_tx: mpsc::Sender<NetworkEvent>,
) -> Result<(), Box<dyn std::error::Error>> {
    let peer_id = id_keys.public().to_peer_id();

    let message_authenticity = gossipsub::MessageAuthenticity::Signed(id_keys.clone());
    let gossipsub_config = gossipsub::ConfigBuilder::default()
        .heartbeat_interval(Duration::from_secs(10))
        .validation_mode(gossipsub::ValidationMode::Strict)
        .mesh_outbound_min(1)
        .mesh_n_low(2)
        .mesh_n(4)
        .mesh_n_high(6)
        .history_length(10)
        .history_gossip(3)
        .build()
        .map_err(|e| format!("Gossipsub config error: {}", e))?;

    let gossipsub = gossipsub::Behaviour::new(message_authenticity, gossipsub_config)
        .map_err(|e| format!("Gossipsub behaviour error: {}", e))?;

    let mdns = mdns::tokio::Behaviour::new(mdns::Config::default(), peer_id)?;
    let identify = identify::Behaviour::new(identify::Config::new(
        "/pubdesk/sync/1.0.0".to_string(),
        id_keys.public(),
    ));
    let ping = ping::Behaviour::default();
    let relay = relay::Behaviour::new(peer_id, Default::default());

    let mut swarm = SwarmBuilder::with_existing_identity(id_keys)
        .with_tokio()
        .with_tcp(
            libp2p::tcp::Config::default(),
            libp2p::noise::Config::new,
            libp2p::yamux::Config::default,
        )?
        .with_behaviour(|_| SyncBehaviour {
            gossipsub,
            mdns,
            identify,
            ping,
            relay,
        })?
        .with_swarm_config(|c| c.with_idle_connection_timeout(Duration::from_secs(120)))
        .build();

    let topic = gossipsub::IdentTopic::new(workspace_id.clone());
    swarm.behaviour_mut().gossipsub.subscribe(&topic)?;

    let mut pending_peer_sources: HashMap<PeerId, String> = HashMap::new();
    let mut known_peer_sources: HashMap<PeerId, String> = HashMap::new();

    for addr_str in DEFAULT_BOOTSTRAPS {
        if let Ok(addr) = addr_str.parse::<Multiaddr>() {
            if let Some(pid) = addr.iter().find_map(|p| match p {
                libp2p::multiaddr::Protocol::P2p(p) => Some(p),
                _ => None,
            }) {
                pending_peer_sources.insert(pid, SOURCE_RELAY.to_string());
            }
            let _ = swarm.dial(addr);
        }
    }

    let mut local_addresses: Vec<Multiaddr> = Vec::new();
    let mut connected_peers: Vec<PeerInfo> = Vec::new();

    loop {
        tokio::select! {
            cmd = cmd_rx.recv() => {
                match cmd {
                    Some(NetworkCommand::StartListening { port, sender }) => {
                        let listen_addr = if port > 0 {
                            format!("/ip4/0.0.0.0/tcp/{}", port).parse().unwrap()
                        } else {
                            "/ip4/0.0.0.0/tcp/0".parse().unwrap()
                        };
                        match swarm.listen_on(listen_addr) {
                            Ok(_) => {
                                tokio::time::sleep(Duration::from_millis(200)).await;
                                let addrs: Vec<Multiaddr> = swarm.listeners().map(|a| a.clone()).collect();
                                let _ = sender.send(Ok(addrs));
                            }
                            Err(e) => { let _ = sender.send(Err(format!("{:?}", e))); }
                        }
                    }
                    Some(NetworkCommand::Publish { workspace_id: ws, payload_b64, sender }) => {
                        let t = gossipsub::IdentTopic::new(ws);
                        let data = base64::Engine::decode(&base64::prelude::BASE64_STANDARD, &payload_b64)
                            .unwrap_or_default();
                        match swarm.behaviour_mut().gossipsub.publish(t, data) {
                            Ok(_) => { let _ = sender.send(Ok(())); }
                            Err(e) => { let _ = sender.send(Err(format!("{:?}", e))); }
                        }
                    }
                    Some(NetworkCommand::Dial { addr, source, sender }) => {
                        if let Some(pid) = addr.iter().find_map(|p| match p {
                            libp2p::multiaddr::Protocol::P2p(p) => Some(p),
                            _ => None,
                        }) {
                            pending_peer_sources.insert(pid, source);
                        }
                        match swarm.dial(addr.clone()) {
                            Ok(_) => { let _ = sender.send(Ok(())); }
                            Err(e) => { let _ = sender.send(Err(format!("{:?}", e))); }
                        }
                    }
                    Some(NetworkCommand::GetStatus { sender }) => {
                        let status = NetworkStatus {
                            peer_id: peer_id.to_string(),
                            local_addresses: local_addresses.iter().map(|a| a.to_string()).collect(),
                            connected_peers: connected_peers.clone(),
                            subscribed_topics: vec![workspace_id.clone()],
                        };
                        let _ = sender.send(status);
                    }
                    None => break,
                }
            }
            event = swarm.select_next_some() => {
                match event {
                    SwarmEvent::NewListenAddr { address, .. } => {
                        if !local_addresses.contains(&address) {
                            local_addresses.push(address.clone());
                        }
                    }
                    SwarmEvent::ConnectionEstablished { peer_id: pid, .. } => {
                        if connected_peers.iter().any(|p| p.peer_id == pid.to_string()) {
                            continue;
                        }
                        let source = pending_peer_sources
                            .remove(&pid)
                            .or_else(|| known_peer_sources.get(&pid).cloned())
                            .unwrap_or_else(|| SOURCE_INBOUND.to_string());
                        known_peer_sources.insert(pid, source.clone());
                        let info = PeerInfo {
                            peer_id: pid.to_string(),
                            source,
                        };
                        connected_peers.push(info.clone());
                        let _ = event_tx.try_send(NetworkEvent::PeerConnected(info));
                    }
                    SwarmEvent::ConnectionClosed { peer_id: pid, .. } => {
                        connected_peers.retain(|p| p.peer_id != pid.to_string());
                        let _ = event_tx.try_send(NetworkEvent::PeerDisconnected(pid.to_string()));
                    }
                    SwarmEvent::Behaviour(SyncBehaviourEvent::Mdns(mdns::Event::Discovered(list))) => {
                        for (pid, addr) in list {
                            if pid == peer_id { continue; }
                            pending_peer_sources.insert(pid, SOURCE_LAN.to_string());
                            let full_addr = addr.with(libp2p::multiaddr::Protocol::P2p(pid));
                            let _ = swarm.dial(full_addr);
                        }
                    }
                    SwarmEvent::Behaviour(SyncBehaviourEvent::Mdns(mdns::Event::Expired(list))) => {
                        for (pid, _addr) in list {
                            let _ = event_tx.try_send(NetworkEvent::PeerDisconnected(pid.to_string()));
                        }
                    }
                    SwarmEvent::Behaviour(SyncBehaviourEvent::Gossipsub(gossipsub::Event::Message {
                        propagation_source: _,
                        message_id: _,
                        message,
                    })) => {
                        let envelope = SyncEnvelope {
                            workspace_id: workspace_id.clone(),
                            payload_b64: base64::Engine::encode(
                                &base64::prelude::BASE64_STANDARD,
                                &message.data,
                            ),
                        };
                        let _ = event_tx.try_send(NetworkEvent::EnvelopeReceived {
                            peer_id: message.source.map(|p| p.to_string()).unwrap_or_default(),
                            envelope,
                        });
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(())
}

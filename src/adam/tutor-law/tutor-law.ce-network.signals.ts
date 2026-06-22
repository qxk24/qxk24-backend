/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Intent Signals
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { NetworkTopic } from './tutor-law.ce-network.types';

export const NET_CONCEPT_SIGNALS = [
  'apa itu', 'apa maksud', 'tak faham', 'explain', 'terangkan', 'what is',
  'macam mana', 'how does', 'beza antara', 'apa beza', 'difference between',
  'kenapa', 'why', 'don\'t understand', 'confused',
] as const;

export const NET_ANALYZE_SIGNALS = [
  'kenapa berlaku', 'why does', 'what causes', 'apa punca', 'analisis',
  'analyze', 'analyse', 'diagnose', 'congestion', 'kesesakan',
  'packet loss', 'hilang paket', 'latency', 'kelewatan', 'bottleneck',
  'kenapa tidak', 'why not', 'routing loop', 'gelung penghalaan',
] as const;

export const NET_TRACE_SIGNALS = [
  'trace', 'jejak', 'step through', 'ikut langkah', 'walk through',
  'handshake', 'jabat tangan', 'packet flow', 'aliran paket',
  'what happens when', 'apa berlaku bila', 'follow the packet',
  'osi layer', 'lapisan osi', 'encapsulation', 'penyamakan',
] as const;

export const NET_DESIGN_SIGNALS = [
  'design network', 'reka rangkaian', 'network topology', 'topologi',
  'subnet', 'cidr', 'ip plan', 'addressing scheme', 'skema alamat',
  'how to configure', 'macam mana nak konfigur', 'vlan design',
  'routing table design', 'reka penghalaan',
] as const;

export const NET_VERIFY_SIGNALS = [
  'betul tak', 'correct', 'is this right', 'sahkan', 'verify',
  'jawapan saya', 'my answer', 'subnet betul', 'header betul',
  'check my', 'semak jawapan',
] as const;

export const NET_EXAM_SIGNALS = [
  'tolong selesaikan', 'jawabkan', 'siapkan', 'tugasan', 'assignment',
  'soalan peperiksaan', 'do this for me', 'solve this for me',
  'configure router for me', 'tulis konfigurasi', 'complete the network design',
] as const;

export const NET_TOPIC_SIGNALS: Record<NetworkTopic, readonly string[]> = {
  [NetworkTopic.TCP_UDP]:              ['tcp', 'udp', 'three-way handshake', 'handshake', 'port', 'socket', 'ack', 'syn', 'fin'],
  [NetworkTopic.IP_ROUTING]:           ['ip', 'routing', 'penghalaan', 'bgp', 'ospf', 'rip', 'router', 'subnet', 'cidr', 'nat', 'arp'],
  [NetworkTopic.OSI_MODEL]:            ['osi', 'osi model', 'tcp/ip', 'layer', 'lapisan', 'encapsulation', 'physical layer', 'data link'],
  [NetworkTopic.APPLICATION_PROTOCOL]: ['http', 'https', 'dns', 'dhcp', 'ftp', 'smtp', 'api', 'rest'],
  [NetworkTopic.SECURITY_TLS]:         ['tls', 'ssl', 'encryption', 'enkripsi', 'certificate', 'firewall', 'vpn'],
  [NetworkTopic.SWITCHING_LAN]:        ['switch', 'hub', 'mac address', 'ethernet', 'vlan', 'lan', 'broadcast domain'],
  [NetworkTopic.WIRELESS]:             ['wifi', 'wi-fi', 'wireless', 'tanpa wayar', '802.11', 'access point', 'ssid'],
  [NetworkTopic.UNKNOWN]:              [],
};

export const NET_PACKET_MARKERS = [
  'packet', 'paket', 'frame', 'datagram', 'header', 'payload',
] as const;

export const NET_ADDRESS_MARKERS = [
  'ip address', 'alamat ip', 'subnet mask', 'cidr', 'mac address',
  'port number', 'nombor port', 'ipv4', 'ipv6',
] as const;

export const NET_TOPOLOGY_MARKERS = [
  'topology', 'topologi', 'star topology', 'bus topology', 'mesh',
  'network diagram', 'rajah rangkaian',
] as const;

export function countNetworkHits(norm: string, signals: readonly string[]): number {
  return signals.filter((signal) => {
    if (signal.includes(' ')) return norm.includes(signal);
    const re = new RegExp(`\\b${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return re.test(norm);
  }).length;
}

export function detectNetworkTopic(
  norm: string,
  prior: NetworkTopic | null,
): NetworkTopic {
  const topicBoosts: Array<{ pattern: RegExp; topic: NetworkTopic }> = [
    { pattern: /\b(?:three-way handshake|tcp handshake|syn.?ack)\b/, topic: NetworkTopic.TCP_UDP },
    { pattern: /\b(?:tcp|udp)\b/, topic: NetworkTopic.TCP_UDP },
    { pattern: /\b(?:bgp|ospf|rip|routing table|penghalaan)\b/, topic: NetworkTopic.IP_ROUTING },
    { pattern: /\b(?:osi model|tcp\/ip model|seven layers)\b/, topic: NetworkTopic.OSI_MODEL },
    { pattern: /\b(?:http|https|dns|dhcp)\b/, topic: NetworkTopic.APPLICATION_PROTOCOL },
    { pattern: /\b(?:tls|ssl|certificate|firewall)\b/, topic: NetworkTopic.SECURITY_TLS },
    { pattern: /\b(?:vlan|switch|ethernet|mac address)\b/, topic: NetworkTopic.SWITCHING_LAN },
    { pattern: /\b(?:wifi|wi-fi|802\.11|wireless)\b/, topic: NetworkTopic.WIRELESS },
  ];
  for (const { pattern, topic } of topicBoosts) {
    if (pattern.test(norm)) return topic;
  }

  let best: NetworkTopic = NetworkTopic.UNKNOWN;
  let bestScore = 0;
  for (const [topic, signals] of Object.entries(NET_TOPIC_SIGNALS)) {
    if (topic === NetworkTopic.UNKNOWN) continue;
    const score = countNetworkHits(norm, signals);
    if (score > bestScore) {
      bestScore = score;
      best = topic as NetworkTopic;
    }
  }
  return bestScore > 0 ? best : (prior ?? NetworkTopic.UNKNOWN);
}

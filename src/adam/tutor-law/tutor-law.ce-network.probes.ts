/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Network Pedagogy Scripts
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
 *
 * Layer before detail. Trace packet before explain protocol. No full configs.
 */

import { NetworkTopic } from './tutor-law.ce-network.types';

export const ANALYZE_PROBES: Partial<Record<NetworkTopic, string>> = {
  [NetworkTopic.TCP_UDP]:
    'Sebelum kita jawab — di lapisan mana masalah ni berlaku (application, transport, network)? Senaraikan apa yang kamu dah observe (timeout, reset, duplicate ACK?).',
  [NetworkTopic.IP_ROUTING]:
    'Untuk analisis routing — lukis topologi kecil dan routing table untuk setiap router. Dari situ kita boleh nampak loop atau missing route.',
  [NetworkTopic.OSI_MODEL]:
    'Untuk analisis OSI — mulakan dengan: masalah ni kelihatan di lapisan mana? Apa bukti yang menunjukkan lapisan tu (frame error vs port closed vs DNS fail)?',
  [NetworkTopic.SECURITY_TLS]:
    'Untuk analisis keselamatan — apa threat model kamu (sniffing, MITM, spoofing)? Jangan lompat terus ke cipher — kenal pasti aset dan saluran dulu.',
  [NetworkTopic.UNKNOWN]:
    'Sebelum analisis — apa host, link, dan protocol yang terlibat? Cuba nyatakan di mana kamu rasa failure berlaku dalam path.',
};

export const TRACE_PROBES: Partial<Record<NetworkTopic, string>> = {
  [NetworkTopic.TCP_UDP]:
    'Trace three-way handshake untuk connection baru. Tunjukkan SYN, SYN-ACK, ACK — siapa hantar apa pada setiap langkah.',
  [NetworkTopic.IP_ROUTING]:
    'Pilih satu paket dari host A ke host B. Trace hop demi hop: setiap router buat apa pada destination IP?',
  [NetworkTopic.OSI_MODEL]:
    'Trace satu HTTP request: namakan header/bungkusan di setiap lapisan (application → transport → network → link). Satu lapisan pada satu masa.',
  [NetworkTopic.APPLICATION_PROTOCOL]:
    'Trace DNS lookup untuk satu domain: client → resolver → authoritative. Tunjukkan langkah pertama dan query type.',
  [NetworkTopic.UNKNOWN]:
    'Pilih satu mesej/paket. Trace dari sumber ke destinasi — lapisan atau hop pertama dulu, jangan skip ke jawapan akhir.',
};

export const DESIGN_SCAFFOLDS: Partial<Record<NetworkTopic, string>> = {
  [NetworkTopic.IP_ROUTING]:
    'Untuk design rangkaian — JANGAN tulis config router penuh dulu:\n'
    + '1. Berapa subnet dan saiz address space?\n'
    + '2. Topologi fizikal/logikal?\n'
    + '3. Static atau dynamic routing — kenapa?\n'
    + '4. Baru sketch IP plan dan routing policy.',
  [NetworkTopic.SWITCHING_LAN]:
    'Untuk design LAN:\n'
    + '1. Berapa VLAN/broadcast domain?\n'
    + '2. Di mana L3 boundary (router/firewall)?\n'
    + '3. Addressing per VLAN?\n'
    + '4. Baru tentukan switch placement dan trunk.',
  [NetworkTopic.SECURITY_TLS]:
    'Untuk design keselamatan (defensif):\n'
    + '1. Apa yang perlu dilindungi in-transit vs at-rest?\n'
    + '2. Trust boundary di mana?\n'
    + '3. TLS termination di mana?\n'
    + '4. Baru pilih cipher/cert strategy — bukan exploit.',
  [NetworkTopic.UNKNOWN]:
    'Untuk design rangkaian:\n'
    + '1. Keperluan (hosts, bandwidth, redundancy)?\n'
    + '2. Topology kasar?\n'
    + '3. Addressing & naming?\n'
    + '4. Baru pilih protocol dan peranti.',
};

export const CONCEPT_PROBES: Partial<Record<NetworkTopic, string>> = {
  [NetworkTopic.TCP_UDP]:
    'Sebelum TCP vs UDP — apa yang kamu faham tentang reliable vs best-effort delivery? Satu ayat dulu.',
  [NetworkTopic.OSI_MODEL]:
    'Sebelum 7 lapisan — apa masalah yang OSI model cuba susun? Cuba analogi ringkas.',
  [NetworkTopic.IP_ROUTING]:
    'Sebelum routing algorithm — apa beza routing dan switching dalam kata-kata kamu?',
  [NetworkTopic.SECURITY_TLS]:
    'Sebelum TLS handshake — apa yang encryption at transport layer lindungi dan apa yang tidak?',
  [NetworkTopic.UNKNOWN]:
    'Boleh cerita — kamu nak faham konsep protocol, trace packet flow, analisis masalah, atau reka topology?',
};

export const VERIFY_ANCHOR_BM =
  'Sebelum ADAM semak — tunjukkan subnet calculation, header trace, atau rajah kamu dulu. '
  + 'Jawapan nombor betul tanpa langkah kerja tidak mencukupi.';

export const VERIFY_ANCHOR_EN =
  'Before ADAM checks — show your subnet calculation, header trace, or diagram first. '
  + 'A correct number without working is not enough.';

export const EXAM_REDIRECT_BM =
  'Soalan ni nampak dari peperiksaan atau tugasan rangkaian. '
  + 'ADAM tidak akan tulis konfigurasi router/switch siap atau reka topology penuh untuk kamu. '
  + 'Mula dengan: berapa host/subnet dan apa keperluan asas?';

export const EXAM_REDIRECT_EN =
  'This looks like an exam or networking assignment. '
  + 'ADAM will not write complete router/switch configs or full topology for you. '
  + 'Start with: how many hosts/subnets and what are the basic requirements?';

export function isMalayNetworkTurn(norm: string): boolean {
  return /nak|tak|boleh|macam|kenapa|saya|kamu|rangkaian|paket|protokol/.test(norm);
}

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : University Knowledge Map (daily journal topics)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-02
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { AlamtologiPrinciple } from './adam.types';
import mapFile from '../../data/university-knowledge-map.json';

export interface UniversityKnowledgeTopic {
  topicId:        string;
  majorId:        string;
  majorName:      string;
  disciplineId:   string;
  disciplineName: string;
  subfield:       string;
  label:          string;
  alamtologiLens: AlamtologiPrinciple;
}

type RawUniversityTopic = Omit<UniversityKnowledgeTopic, 'alamtologiLens'>;

interface MapFile {
  version:     string;
  topicCount:  number;
  topics:      RawUniversityTopic[];
}

const MAJOR_ALAMTOLOGI_LENS: Record<string, AlamtologiPrinciple> = {
  humanities:  'CAHAYA',
  social:      'BUMI',
  natural:     'AIR',
  formal:      'API',
  applied:     'TENAGA',
};

function lensForMajor(majorId: string): AlamtologiPrinciple {
  return MAJOR_ALAMTOLOGI_LENS[majorId] ?? 'MASA';
}

function isValidTopicRow(t: RawUniversityTopic): boolean {
  const sf = t.subfield.trim();
  if (!sf || sf.length < 3) return false;
  if (sf.includes('**')) return false;
  if (sf === t.disciplineName) return false;
  return true;
}

let cachedTopics: UniversityKnowledgeTopic[] | null = null;

export function loadUniversityKnowledgeTopics(): UniversityKnowledgeTopic[] {
  if (cachedTopics) return cachedTopics;

  const raw = mapFile as MapFile;
  cachedTopics = raw.topics
    .filter(isValidTopicRow)
    .map((t) => ({
      ...t,
      alamtologiLens: lensForMajor(t.majorId),
    }));

  return cachedTopics;
}

export function getUniversityKnowledgeTopicCount(): number {
  return loadUniversityKnowledgeTopics().length;
}

const CONSTITUTIONAL_EPOCH_MS = Date.parse('2026-01-01T00:00:00+08:00');
const MS_PER_DAY = 86_400_000;

export function knowledgeTopicIndexForDate(date = new Date()): number {
  const topics = loadUniversityKnowledgeTopics();
  const n = topics.length;
  if (n === 0) return 0;
  const day = Math.floor((date.getTime() - CONSTITUTIONAL_EPOCH_MS) / MS_PER_DAY);
  return ((day % n) + n) % n;
}

export function getDailyUniversityKnowledgeTopic(date = new Date()): UniversityKnowledgeTopic {
  const topics = loadUniversityKnowledgeTopics();
  if (topics.length === 0) {
    throw new Error('University knowledge map has no topics');
  }
  return topics[knowledgeTopicIndexForDate(date)]!;
}

export function findUniversityTopicById(topicId: string): UniversityKnowledgeTopic | undefined {
  return loadUniversityKnowledgeTopics().find((t) => t.topicId === topicId);
}

export function buildKnowledgeTopicBreadcrumb(topic: UniversityKnowledgeTopic): string {
  return `${topic.majorName} › ${topic.disciplineName} › ${topic.subfield}`;
}

export function listKnowledgeMajorNames(): string[] {
  return [...new Set(loadUniversityKnowledgeTopics().map((t) => t.majorName))].sort();
}

export function searchUniversityKnowledgeTopics(input: {
  q?:     string;
  major?: string;
  limit?: number;
  skip?:  number;
}): { topics: UniversityKnowledgeTopic[]; total: number } {
  let rows = loadUniversityKnowledgeTopics();
  const major = input.major?.trim();
  if (major) {
    rows = rows.filter((t) => t.majorName === major);
  }
  const q = input.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (t) =>
        t.topicId.toLowerCase().includes(q)
        || t.label.toLowerCase().includes(q)
        || t.subfield.toLowerCase().includes(q)
        || t.disciplineName.toLowerCase().includes(q),
    );
  }
  const total = rows.length;
  const skip = Math.max(0, input.skip ?? 0);
  const limit = Math.min(Math.max(1, input.limit ?? 24), 100);
  return { topics: rows.slice(skip, skip + limit), total };
}

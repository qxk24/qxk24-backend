/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : K24 Level Orchestrator (Fractal AMA Composition)
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-07
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 *
 * AMA hierarchy: za → ji → at → si → ob → ak → md
 * 1 + 6 composition at each level — no summarize(), no level skipping.
 */

/** AMA PDF K24 level codes (distinct from legacy adam.types K24Level) */
export type AmaK24LevelCode = 'za' | 'ji' | 'at' | 'si' | 'ob' | 'ak' | 'md';

export const AMA_K24_LEVEL_ORDER: AmaK24LevelCode[] = [
  'za', 'ji', 'at', 'si', 'ob', 'ak', 'md',
];

export const AMA_K24_BRANCHING = 6;

/** Expected K24za leaf count when one md module is fully expanded */
export const AMA_K24_ZA_COUNT_AT_MD = 46_656;

export interface K24ZaUnit {
  id:      string;
  payload: Record<string, unknown>;
}

export interface K24ComposedNode {
  level:      AmaK24LevelCode;
  id:         string;
  children:   K24ComposedNode[];
  zaUnits:    K24ZaUnit[];
  _flatCache: K24ZaUnit[] | null;
}

export class K24CompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'K24CompositionError';
  }
}

function levelIndex(code: AmaK24LevelCode): number {
  return AMA_K24_LEVEL_ORDER.indexOf(code);
}

/** 6^index za units at fully expanded level */
export function expectedZaCountAtLevel(level: AmaK24LevelCode): number {
  const idx = levelIndex(level);
  if (idx < 0) return 0;
  return AMA_K24_BRANCHING ** idx;
}

export function validateChildCount(
  level: AmaK24LevelCode,
  childCount: number,
): boolean {
  if (level === 'za') return true;
  return childCount === AMA_K24_BRANCHING;
}

/**
 * Compose a K24 node.
 * za: one or more atomic units in this node
 * ji..md: exactly 6 children of the previous level
 */
export function composeK24(
  level: AmaK24LevelCode,
  input: K24ZaUnit[] | K24ComposedNode[],
  nodeId?: string,
): K24ComposedNode {
  const id = nodeId ?? `K24-${level}-${Date.now()}`;

  if (level === 'za') {
    const zaUnits = input as K24ZaUnit[];
    return {
      level: 'za',
      id,
      children: [],
      zaUnits,
      _flatCache: null,
    };
  }

  const children = input as K24ComposedNode[];
  const expectedChildLevel = AMA_K24_LEVEL_ORDER[levelIndex(level) - 1];

  if (!validateChildCount(level, children.length)) {
    throw new K24CompositionError(
      `Level ${level} requires exactly ${AMA_K24_BRANCHING} children; got ${children.length}`,
    );
  }

  for (const child of children) {
    if (child.level !== expectedChildLevel) {
      throw new K24CompositionError(
        `Level ${level} child must be ${expectedChildLevel}; got ${child.level}`,
      );
    }
  }

  return {
    level,
    id,
    children,
    zaUnits: [],
    _flatCache: null,
  };
}

/** Lazy flatten — no precision loss in payload values */
export function getUnits(node: K24ComposedNode): K24ZaUnit[] {
  if (node._flatCache) return node._flatCache;

  if (node.level === 'za') {
    node._flatCache = [...node.zaUnits];
    return node._flatCache;
  }

  const flat: K24ZaUnit[] = [];
  for (const child of node.children) {
    flat.push(...getUnits(child));
  }
  node._flatCache = flat;
  return flat;
}

export function countZaUnits(node: K24ComposedNode): number {
  return getUnits(node).length;
}

export function validateIntegrity(node: K24ComposedNode): boolean {
  if (node.level === 'za') {
    return node.zaUnits.length > 0 && node.zaUnits.every((u) => Boolean(u.id));
  }
  if (!validateChildCount(node.level, node.children.length)) return false;
  return node.children.every(validateIntegrity);
}

function groupIntoParents(
  children: K24ComposedNode[],
  parentLevel: AmaK24LevelCode,
  childLevel: AmaK24LevelCode,
): K24ComposedNode[] {
  const parents: K24ComposedNode[] = [];
  for (let i = 0; i < children.length; i += AMA_K24_BRANCHING) {
    const chunk = children.slice(i, i + AMA_K24_BRANCHING);
    if (chunk.length !== AMA_K24_BRANCHING) {
      throw new K24CompositionError(
        `Cannot group ${chunk.length} ${childLevel} nodes into ${parentLevel}`,
      );
    }
    parents.push(composeK24(parentLevel, chunk, `${parentLevel}-${parents.length}`));
  }
  return parents;
}

/**
 * Build one md module from exactly 46656 za units (6^6).
 * Preserves original payload values — no summarization.
 */
export function buildMdFromZaUnits(allZa: K24ZaUnit[]): K24ComposedNode {
  if (allZa.length !== AMA_K24_ZA_COUNT_AT_MD) {
    throw new K24CompositionError(
      `md requires ${AMA_K24_ZA_COUNT_AT_MD} za units; got ${allZa.length}`,
    );
  }

  const zaNodes = allZa.map((unit, i) =>
    composeK24('za', [unit], `za-${i}`),
  );

  const jiNodes = groupIntoParents(zaNodes, 'ji', 'za');
  const atNodes = groupIntoParents(jiNodes, 'at', 'ji');
  const siNodes = groupIntoParents(atNodes, 'si', 'at');
  const obNodes = groupIntoParents(siNodes, 'ob', 'si');
  const akNodes = groupIntoParents(obNodes, 'ak', 'ob');
  return composeK24('md', akNodes, 'md-root');
}

/** Sample ji from 6 za units — unit tests without full md tree */
export function composeSampleJiFromZa(zaUnits: K24ZaUnit[]): K24ComposedNode {
  if (zaUnits.length !== AMA_K24_BRANCHING) {
    throw new K24CompositionError(
      `Sample ji requires ${AMA_K24_BRANCHING} za units`,
    );
  }
  const zaNodes = zaUnits.map((u, i) =>
    composeK24('za', [u], `za-sample-${i}`),
  );
  return composeK24('ji', zaNodes, 'ji-sample');
}

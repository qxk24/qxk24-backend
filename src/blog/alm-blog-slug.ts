/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Blog Slug Helpers
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import mongoose from 'mongoose';
import { AlmBlogPostModel } from './alm-blog.schema';

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return base || 'post';
}

export async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  let suffix = 0;

  for (;;) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId && mongoose.isValidObjectId(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    const exists = await AlmBlogPostModel.exists(query);
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

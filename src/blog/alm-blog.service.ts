/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Alamtologi Blog Service
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
import {
  AlmBlogPostModel,
  type AlmBlogPostDocument,
  type BlogMediaItem,
  type BlogPostStatus,
} from './alm-blog.schema';
import { ensureUniqueSlug, slugifyTitle } from './alm-blog-slug';

export interface BlogPostDto {
  id:           string;
  slug:         string;
  title:        string;
  summary:      string;
  content:      string;
  contentFormat: 'html';
  coverImage:   string;
  media:        BlogMediaItem[];
  status:       BlogPostStatus;
  authorId:     string;
  publishedAt?: string;
  createdAt:    string;
  updatedAt:    string;
}

type BlogPostSource = Pick<
  AlmBlogPostDocument,
  | 'slug' | 'title' | 'summary' | 'content' | 'contentFormat' | 'coverImage'
  | 'media' | 'status' | 'authorId' | 'publishedAt' | 'createdAt' | 'updatedAt'
> & { _id: mongoose.Types.ObjectId };

function toDto(doc: BlogPostSource): BlogPostDto {
  return {
    id:            String(doc._id),
    slug:          doc.slug,
    title:         doc.title,
    summary:       doc.summary,
    content:       doc.content,
    contentFormat: doc.contentFormat,
    coverImage:    doc.coverImage,
    media:         doc.media ?? [],
    status:        doc.status,
    authorId:      doc.authorId,
    publishedAt:   doc.publishedAt?.toISOString(),
    createdAt:     doc.createdAt.toISOString(),
    updatedAt:     doc.updatedAt.toISOString(),
  };
}

export interface CreateBlogPostInput {
  title?:    string;
  summary?:  string;
  content?:  string;
  coverImage?: string;
  media?:    BlogMediaItem[];
}

export async function createBlogDraft(
  input: CreateBlogPostInput = {},
): Promise<BlogPostDto> {
  const title = (input.title ?? 'Untitled draft').trim() || 'Untitled draft';
  const baseSlug = slugifyTitle(title);
  const slug = await ensureUniqueSlug(baseSlug);

  const doc = await AlmBlogPostModel.create({
    slug,
    title,
    summary:     input.summary ?? '',
    content:     input.content ?? '',
    coverImage:  input.coverImage ?? '',
    media:       input.media ?? [],
    status:      'DRAFT',
    authorId:    'masa-bayu',
  });

  return toDto(doc);
}

export async function listAllBlogPosts(): Promise<BlogPostDto[]> {
  const docs = await AlmBlogPostModel.find()
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((d) => toDto(d));
}

export async function listPublishedBlogPosts(): Promise<BlogPostDto[]> {
  const docs = await AlmBlogPostModel.find({ status: 'PUBLISHED' })
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();
  return docs.map((d) => toDto(d));
}

export async function getBlogPostById(id: string): Promise<BlogPostDto | null> {
  const doc = await AlmBlogPostModel.findById(id);
  return doc ? toDto(doc) : null;
}

export async function getPublishedBlogPostBySlug(
  slug: string,
): Promise<BlogPostDto | null> {
  const doc = await AlmBlogPostModel.findOne({
    slug: slug.trim().toLowerCase(),
    status: 'PUBLISHED',
  });
  return doc ? toDto(doc) : null;
}

export interface UpdateBlogPostInput {
  title?:       string;
  summary?:     string;
  content?:     string;
  coverImage?:  string;
  media?:       BlogMediaItem[];
  slug?:        string;
}

export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput,
): Promise<BlogPostDto | null> {
  const doc = await AlmBlogPostModel.findById(id);
  if (!doc) return null;

  if (input.title !== undefined) {
    doc.title = input.title.trim() || doc.title;
    if (doc.status === 'DRAFT') {
      const base = slugifyTitle(doc.title);
      doc.slug = await ensureUniqueSlug(base, String(doc._id));
    }
  }
  if (input.summary !== undefined) doc.summary = input.summary;
  if (input.content !== undefined) doc.content = input.content;
  if (input.coverImage !== undefined) doc.coverImage = input.coverImage;
  if (input.media !== undefined) doc.media = input.media;

  await doc.save();
  return toDto(doc);
}

export async function publishBlogPost(id: string): Promise<BlogPostDto | null> {
  const doc = await AlmBlogPostModel.findById(id);
  if (!doc) return null;

  doc.status = 'PUBLISHED';
  doc.publishedAt = doc.publishedAt ?? new Date();
  await doc.save();
  return toDto(doc);
}

export async function unpublishBlogPost(id: string): Promise<BlogPostDto | null> {
  const doc = await AlmBlogPostModel.findById(id);
  if (!doc) return null;

  doc.status = 'DRAFT';
  await doc.save();
  return toDto(doc);
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  const result = await AlmBlogPostModel.findByIdAndDelete(id);
  return result !== null;
}

/** Public list — summary fields only */
export interface BlogPostListItem {
  id:          string;
  slug:        string;
  title:       string;
  summary:     string;
  coverImage:  string;
  publishedAt?: string;
}

export function toListItem(dto: BlogPostDto): BlogPostListItem {
  return {
    id:          dto.id,
    slug:        dto.slug,
    title:       dto.title,
    summary:     dto.summary,
    coverImage:  dto.coverImage,
    publishedAt: dto.publishedAt,
  };
}

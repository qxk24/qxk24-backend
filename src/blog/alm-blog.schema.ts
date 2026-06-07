/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Alamtologi Blog MongoDB Schema
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

import mongoose, { Schema, Document } from 'mongoose';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';
export type BlogMediaType = 'image' | 'video';

export interface BlogMediaItem {
  type:               BlogMediaType;
  url:                string;
  caption?:           string;
  size?:              number;
  mimeType?:          string;
  cloudinaryPublicId?: string;
}

export interface AlmBlogPostDocument extends Document {
  slug:         string;
  title:        string;
  summary:      string;
  content:      string;
  contentFormat: 'html';
  coverImage:   string;
  media:        BlogMediaItem[];
  status:       BlogPostStatus;
  authorId:     string;
  publishedAt?: Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const BlogMediaSchema = new Schema<BlogMediaItem>(
  {
    type:               { type: String, enum: ['image', 'video'], required: true },
    url:                { type: String, required: true },
    caption:            { type: String, default: '' },
    size:               { type: Number, default: 0 },
    mimeType:           { type: String, default: '' },
    cloudinaryPublicId: { type: String, default: '' },
  },
  { _id: false },
);

const AlmBlogPostSchema = new Schema<AlmBlogPostDocument>(
  {
    slug:          { type: String, required: true, trim: true, lowercase: true },
    title:         { type: String, required: true, trim: true, maxlength: 300 },
    summary:       { type: String, default: '', maxlength: 2000 },
    content:       { type: String, default: '' },
    contentFormat: { type: String, enum: ['html'], default: 'html' },
    coverImage:    { type: String, default: '' },
    media:         { type: [BlogMediaSchema], default: [] },
    status:        { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    authorId:      { type: String, default: 'masa-bayu' },
    publishedAt:   { type: Date },
  },
  {
    collection: 'alm_blog_posts',
    timestamps: true,
  },
);

AlmBlogPostSchema.index({ slug: 1 }, { unique: true });
AlmBlogPostSchema.index({ status: 1, publishedAt: -1 });
AlmBlogPostSchema.index({ createdAt: -1 });

export const AlmBlogPostModel = mongoose.model<AlmBlogPostDocument>(
  'AlmBlogPost',
  AlmBlogPostSchema,
);

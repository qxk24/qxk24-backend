/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Blog Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-04
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireFounder } from '../../middleware/auth.middleware';
import { ENV } from '../../config/environments';
import { getMultipartUploadFile } from '../../adam/adam-file-extract.service';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from '../../services/cloudinary.service';
import {
  createBlogDraft,
  deleteBlogPost,
  getBlogPostById,
  getPublishedBlogPostBySlug,
  listAllBlogPosts,
  listPublishedBlogPosts,
  publishBlogPost,
  toListItem,
  unpublishBlogPost,
  updateBlogPost,
} from '../../blog/alm-blog.service';
import type { BlogMediaItem } from '../../blog/alm-blog.schema';

const router = new Hono();

const MediaItemSchema = z.object({
  type:               z.enum(['image', 'video']),
  url:                z.string().url(),
  caption:            z.string().optional(),
  size:               z.number().optional(),
  mimeType:           z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
});

const CreateSchema = z.object({
  title:      z.string().max(300).optional(),
  summary:    z.string().max(2000).optional(),
  content:    z.string().optional(),
  coverImage: z.string().optional(),
  media:      z.array(MediaItemSchema).optional(),
});

const UpdateSchema = z.object({
  title:      z.string().max(300).optional(),
  summary:    z.string().max(2000).optional(),
  content:    z.string().optional(),
  coverImage: z.string().optional(),
  media:      z.array(MediaItemSchema).optional(),
});

function blogImageMaxBytes(): number {
  return ENV.BLOG_IMAGE_MAX_MB * 1024 * 1024;
}

function blogVideoMaxBytes(): number {
  return ENV.BLOG_VIDEO_MAX_MB * 1024 * 1024;
}

function assertBlogFile(
  file: File,
  kind: 'image' | 'video',
): { ok: true } | { ok: false; error: string } {
  const max = kind === 'image' ? blogImageMaxBytes() : blogVideoMaxBytes();
  const maxMb = kind === 'image' ? ENV.BLOG_IMAGE_MAX_MB : ENV.BLOG_VIDEO_MAX_MB;

  if (file.size > max) {
    return {
      ok:    false,
      error: `File exceeds maximum ${kind} size of ${maxMb}MB.`,
    };
  }

  const mime = (file.type || '').toLowerCase();
  if (kind === 'image' && !mime.startsWith('image/')) {
    return { ok: false, error: 'Only image files are allowed for image upload.' };
  }
  if (kind === 'video' && !mime.startsWith('video/')) {
    return { ok: false, error: 'Only video files are allowed for video upload.' };
  }

  return { ok: true };
}

// ─── Public (register before /:id) ───────────────────────

router.get('/public/list', async (c) => {
  try {
    const posts = await listPublishedBlogPosts();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { posts: posts.map(toListItem) },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.get('/public/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await getPublishedBlogPostBySlug(slug);
    if (!post) {
      return c.json({
        success: false,
        error:   'Post not found.',
        kernel:  'ALAMTOLOGI',
      }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

// ─── Founder uploads ─────────────────────────────────────

router.post('/upload/image', requireFounder, async (c) => {
  if (!isCloudinaryConfigured()) {
    return c.json({
      success: false,
      error:   'Cloudinary is not configured on this server.',
      kernel:  'ALAMTOLOGI',
    }, 503);
  }

  const body = await c.req.parseBody();
  const file = getMultipartUploadFile(body as Record<string, unknown>, 'file');
  if (!file) {
    return c.json({ success: false, error: 'No file provided. Use field name "file".', kernel: 'ALAMTOLOGI' }, 400);
  }

  const check = assertBlogFile(file, 'image');
  if (!check.ok) {
    return c.json({ success: false, error: check.error, kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    const uploaded = await uploadToCloudinary(file, 'image');
    const media: BlogMediaItem = {
      type:               'image',
      url:                uploaded.secureUrl,
      size:               uploaded.bytes,
      mimeType:           uploaded.mimeType,
      cloudinaryPublicId: uploaded.publicId,
    };
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { url: uploaded.secureUrl, media },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 502);
  }
});

router.post('/upload/video', requireFounder, async (c) => {
  if (!isCloudinaryConfigured()) {
    return c.json({
      success: false,
      error:   'Cloudinary is not configured on this server.',
      kernel:  'ALAMTOLOGI',
    }, 503);
  }

  const body = await c.req.parseBody();
  const file = getMultipartUploadFile(body as Record<string, unknown>, 'file');
  if (!file) {
    return c.json({ success: false, error: 'No file provided. Use field name "file".', kernel: 'ALAMTOLOGI' }, 400);
  }

  const check = assertBlogFile(file, 'video');
  if (!check.ok) {
    return c.json({ success: false, error: check.error, kernel: 'ALAMTOLOGI' }, 400);
  }

  try {
    const uploaded = await uploadToCloudinary(file, 'video');
    const media: BlogMediaItem = {
      type:               'video',
      url:                uploaded.secureUrl,
      size:               uploaded.bytes,
      mimeType:           uploaded.mimeType,
      cloudinaryPublicId: uploaded.publicId,
    };
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { url: uploaded.secureUrl, media },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 502);
  }
});

// ─── Founder CRUD ────────────────────────────────────────

router.post('/create', requireFounder, zValidator('json', CreateSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const post = await createBlogDraft(body);
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    }, 201);

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.get('/list', requireFounder, async (c) => {
  try {
    const posts = await listAllBlogPosts();
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { posts },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

function requirePostId(c: { req: { param: (k: string) => string | undefined } }): string | null {
  const id = c.req.param('id')?.trim();
  return id || null;
}

router.patch('/:id', requireFounder, zValidator('json', UpdateSchema), async (c) => {
  try {
    const id = requirePostId(c);
    if (!id) {
      return c.json({ success: false, error: 'Post id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const body = c.req.valid('json');
    const post = await updateBlogPost(id, body);
    if (!post) {
      return c.json({ success: false, error: 'Post not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.post('/:id/publish', requireFounder, async (c) => {
  try {
    const id = requirePostId(c);
    if (!id) {
      return c.json({ success: false, error: 'Post id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const post = await publishBlogPost(id);
    if (!post) {
      return c.json({ success: false, error: 'Post not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.post('/:id/unpublish', requireFounder, async (c) => {
  try {
    const id = requirePostId(c);
    if (!id) {
      return c.json({ success: false, error: 'Post id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const post = await unpublishBlogPost(id);
    if (!post) {
      return c.json({ success: false, error: 'Post not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

router.delete('/:id', requireFounder, async (c) => {
  try {
    const id = requirePostId(c);
    if (!id) {
      return c.json({ success: false, error: 'Post id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const ok = await deleteBlogPost(id);
    if (!ok) {
      return c.json({ success: false, error: 'Post not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

/** Founder fetch single post (draft or published) */
router.get('/:id', requireFounder, async (c) => {
  try {
    const id = requirePostId(c);
    if (!id) {
      return c.json({ success: false, error: 'Post id required.', kernel: 'ALAMTOLOGI' }, 400);
    }
    const post = await getBlogPostById(id);
    if (!post) {
      return c.json({ success: false, error: 'Post not found.', kernel: 'ALAMTOLOGI' }, 404);
    }
    return c.json({
      success:   true,
      kernel:    'ALAMTOLOGI',
      data:      { post },
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(err);
    throw err;
  }});

export default router;

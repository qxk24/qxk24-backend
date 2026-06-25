/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Wanx Video Client
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-23
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import { ENV } from '../config/environments';
import { mediaMaxVideoSeconds } from './adam-media-quota-tier';

const WANX_VIDEO_TASK_POLL_MS = 4_000;
const WANX_VIDEO_TASK_MAX_POLLS = 90;

function dashscopeApiKey(): string {
  return (ENV.DASHSCOPE_API_KEY ?? '').trim();
}

function wanxBaseUrl(): string {
  return ENV.QWEN_API_BASE.replace(/\/compatible-mode\/v1\/?$/, '/api/v1');
}

interface WanxVideoTaskResponse {
  output?: {
    task_status?: string;
    video_url?: string;
    results?: Array<{ url?: string }>;
    message?: string;
  };
}

export interface WanxVideoProgress {
  taskId: string;
  status:  string;
  poll:    number;
}

export function isWanxVideoConfigured(): boolean {
  return Boolean(dashscopeApiKey());
}

/** Snap user-requested seconds to Wanx-supported clip lengths (5 or 10). */
export function snapWanxVideoDuration(seconds: number): number {
  const max = mediaMaxVideoSeconds();
  const clamped = Math.min(Math.max(1, seconds), max);
  if (max <= 5) return Math.min(5, clamped);
  return clamped <= 7 ? 5 : 10;
}

/** Generate one video via DashScope Wanx async task API. */
export async function generateWanxVideoUrl(
  prompt: string,
  durationSeconds: number,
  onProgress?: (progress: WanxVideoProgress) => void,
): Promise<string | null> {
  const apiKey = dashscopeApiKey();
  if (!apiKey || !prompt.trim()) return null;

  const duration = snapWanxVideoDuration(durationSeconds);

  const createRes = await fetch(
    `${wanxBaseUrl()}/services/aigc/video-generation/video-synthesis`,
    {
      method:  'POST',
      headers: {
        Authorization:       `Bearer ${apiKey}`,
        'Content-Type':      'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: ENV.ADAM_WANX_VIDEO_MODEL,
        input: { prompt: prompt.trim() },
        parameters: {
          size:          '1280*720',
          duration,
          prompt_extend: true,
        },
      }),
    },
  );

  if (!createRes.ok) {
    console.warn('[adam:wanx-video] create task failed', createRes.status, await createRes.text());
    return null;
  }

  const created = await createRes.json() as { output?: { task_id?: string } };
  const taskId = created.output?.task_id;
  if (!taskId) return null;

  onProgress?.({ taskId, status: 'PENDING', poll: 0 });

  for (let i = 0; i < WANX_VIDEO_TASK_MAX_POLLS; i += 1) {
    await new Promise((r) => setTimeout(r, WANX_VIDEO_TASK_POLL_MS));
    const pollRes = await fetch(
      `${wanxBaseUrl()}/tasks/${taskId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!pollRes.ok) continue;

    const task = await pollRes.json() as WanxVideoTaskResponse;
    const status = task.output?.task_status ?? 'UNKNOWN';
    onProgress?.({ taskId, status, poll: i + 1 });

    if (status === 'SUCCEEDED') {
      return task.output?.video_url?.trim()
        ?? task.output?.results?.[0]?.url?.trim()
        ?? null;
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      console.warn('[adam:wanx-video] task failed', status, task.output?.message);
      return null;
    }
  }

  console.warn('[adam:wanx-video] task timed out', taskId);
  return null;
}

export async function downloadVideoBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

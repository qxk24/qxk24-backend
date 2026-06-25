/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Wanx Image Client
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

const WANX_TASK_POLL_MS = 2_000;
const WANX_TASK_MAX_POLLS = 30;

function dashscopeApiKey(): string {
  return (ENV.DASHSCOPE_API_KEY ?? '').trim();
}

function wanxBaseUrl(): string {
  return ENV.QWEN_API_BASE.replace(/\/compatible-mode\/v1\/?$/, '/api/v1');
}

interface WanxTaskResponse {
  output?: {
    task_status?: string;
    results?: Array<{ url?: string }>;
    message?: string;
  };
}

export function isWanxImageConfigured(): boolean {
  return Boolean(dashscopeApiKey());
}

/** Generate one image via DashScope Wanx async task API. Returns image bytes URL fetch source. */
export async function generateWanxImageUrl(prompt: string): Promise<string | null> {
  const apiKey = dashscopeApiKey();
  if (!apiKey || !prompt.trim()) return null;

  const createRes = await fetch(
    `${wanxBaseUrl()}/services/aigc/text2image/image-synthesis`,
    {
      method:  'POST',
      headers: {
        Authorization:     `Bearer ${apiKey}`,
        'Content-Type':    'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: ENV.ADAM_WANX_IMAGE_MODEL,
        input: { prompt: prompt.trim() },
        parameters: { size: '1024*1024', n: 1 },
      }),
    },
  );

  if (!createRes.ok) {
    console.warn('[adam:wanx] create task failed', createRes.status, await createRes.text());
    return null;
  }

  const created = await createRes.json() as { output?: { task_id?: string } };
  const taskId = created.output?.task_id;
  if (!taskId) return null;

  for (let i = 0; i < WANX_TASK_MAX_POLLS; i += 1) {
    await new Promise((r) => setTimeout(r, WANX_TASK_POLL_MS));
    const pollRes = await fetch(
      `${wanxBaseUrl()}/tasks/${taskId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!pollRes.ok) continue;

    const task = await pollRes.json() as WanxTaskResponse;
    const status = task.output?.task_status;
    if (status === 'SUCCEEDED') {
      return task.output?.results?.[0]?.url?.trim() ?? null;
    }
    if (status === 'FAILED' || status === 'CANCELED') {
      console.warn('[adam:wanx] task failed', status, task.output?.message);
      return null;
    }
  }

  console.warn('[adam:wanx] task timed out', taskId);
  return null;
}

export async function downloadImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

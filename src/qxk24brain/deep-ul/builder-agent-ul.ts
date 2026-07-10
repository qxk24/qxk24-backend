/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Deterministic Builder Agent
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-10
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { BuildMessage, QwenToolCall } from '../../agent/adam-builder.types';
import { localVisionEngine } from './local-vision-engine';
import * as os from 'node:os';
import * as path from 'node:path';

export interface BuilderPlannerResponse {
  finish_reason: 'stop' | 'tool_calls';
  content:       string | null;
  tool_calls?:   QwenToolCall[];
}

function lastUserMessage(messages: BuildMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') {
      return typeof messages[i]?.content === 'string' ? messages[i].content! : '';
    }
  }
  return '';
}

function makeToolCall(name: string, args: Record<string, unknown>, id: string): QwenToolCall {
  return {
    id,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

export function planBuilderStep(
  messages: BuildMessage[],
  availableTools: string[],
): BuilderPlannerResponse {
  const text = lastUserMessage(messages);
  const lower = text.toLowerCase();

  const has = (name: string) => availableTools.includes(name);

  if ((lower.includes('list') || lower.includes('directory')) && has('list_directory')) {
    const pathMatch = text.match(/(?:path|folder|dir)[:\s]+([^\s]+)/i);
    return {
      finish_reason: 'tool_calls',
      content:       null,
      tool_calls:    [makeToolCall('list_directory', { path: pathMatch?.[1] ?? '.' }, `ul-${Date.now()}`)],
    };
  }

  if ((lower.includes('read') || lower.includes('show file')) && has('read_file')) {
    const fileMatch = text.match(/([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)/);
    if (fileMatch) {
      return {
        finish_reason: 'tool_calls',
        content:       null,
        tool_calls:    [makeToolCall('read_file', { path: fileMatch[1] }, `ul-${Date.now()}`)],
      };
    }
  }

  if ((lower.includes('write') || lower.includes('create') || lower.includes('propose')) && has('propose_file_write')) {
    const pathMatch = text.match(/([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)/);
    return {
      finish_reason: 'tool_calls',
      content:       null,
      tool_calls:    [
        makeToolCall('propose_file_write', {
          path:    pathMatch?.[1] ?? 'README.md',
          content: '// Deterministic UL builder placeholder — refine via founder approval.',
        }, `ul-${Date.now()}`),
      ],
    };
  }

  if (lower.includes('constitution') && has('get_constitution')) {
    return {
      finish_reason: 'tool_calls',
      content:       null,
      tool_calls:    [makeToolCall('get_constitution', {}, `ul-${Date.now()}`)],
    };
  }

  return {
    finish_reason: 'stop',
    content: [
      'The Universal Operating System has processed your builder request deterministically.',
      text ? `Task: ${text.slice(0, 300)}` : '',
      'Specify list, read, write, or constitution actions for tool execution.',
    ].filter(Boolean).join('\n'),
  };
}

export async function generateMedia(taskDescription: string): Promise<string> {
  const lower = taskDescription.toLowerCase();
  const outDir = os.tmpdir();

  if (lower.includes('video')) {
    const outputPath = path.join(outDir, `adam-ul-${Date.now()}.mp4`);
    try {
      return await localVisionEngine.generateVideo({
        prompt:     taskDescription,
        frames:     24,
        fps:        12,
        outputPath,
      });
    } catch {
      const pngPath = outputPath.replace(/\.mp4$/, '.png');
      return localVisionEngine.generateImage({
        prompt:     taskDescription,
        width:      512,
        height:     512,
        outputPath: pngPath,
      });
    }
  }

  const outputPath = path.join(outDir, `adam-ul-${Date.now()}.png`);
  return localVisionEngine.generateImage({
    prompt:     taskDescription,
    width:      512,
    height:     512,
    outputPath,
  });
}

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : Deep UL — Local Vision Engine
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
 *
 * Local image/video generation — ONNX Stable Diffusion when enabled,
 * deterministic sharp placeholder otherwise (no external APIs).
 */

import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { ENV } from '../../config/environments';

const execAsync = promisify(exec);

export interface ImageGenerationRequest {
  prompt:     string;
  width?:     number;
  height?:    number;
  outputPath: string;
}

export interface VideoGenerationRequest {
  prompt:     string;
  frames?:    number;
  fps?:       number;
  outputPath: string;
}

type TextToImagePipeline = (
  prompt: string,
  options?: Record<string, unknown>,
) => Promise<{ images?: Array<{ data?: Uint8Array | Buffer }> }>;

type ImageClassifier = (
  input: string | Buffer,
) => Promise<Array<{ label: string; score: number }>>;

let imageGenerator: TextToImagePipeline | null = null;
let imageClassifier: ImageClassifier | null = null;
let initialized = false;

function hashPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function loadTransformersPipeline(): Promise<typeof import('@xenova/transformers') | null> {
  if (!ENV.ADAM_LOCAL_ML_ENABLED) return null;
  try {
    return await import('@xenova/transformers');
  } catch {
    console.warn('[LocalVisionEngine] @xenova/transformers unavailable — using sharp fallback');
    return null;
  }
}

async function generatePlaceholderPng(prompt: string, width: number, height: number): Promise<Buffer> {
  const seed = hashPrompt(prompt);
  const r = (seed & 0xff);
  const g = ((seed >> 8) & 0xff);
  const b = ((seed >> 16) & 0xff);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(${r},${g},${b});stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(${255 - r},${255 - g},${255 - b});stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="sans-serif" font-size="14" fill="white" opacity="0.85">
        ${prompt.slice(0, 48).replace(/[<>&]/g, '')}
      </text>
    </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export class LocalVisionEngine {
  async initialize(): Promise<void> {
    if (initialized) return;

    const transformers = await loadTransformersPipeline();
    if (transformers) {
      console.log('[LocalVisionEngine] Loading local Stable Diffusion model...');
      imageGenerator = await transformers.pipeline(
        'text-to-image' as 'image-to-image',
        ENV.ADAM_LOCAL_SD_MODEL,
        { quantized: true },
      ) as TextToImagePipeline;
      imageClassifier = await transformers.pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
      ) as ImageClassifier;
      console.log('[LocalVisionEngine] Model loaded successfully');
    }

    initialized = true;
  }

  async generateImage(request: ImageGenerationRequest): Promise<string> {
    await this.initialize();

    const { prompt, width = 512, height = 512, outputPath } = request;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    let buffer: Buffer;

    if (imageGenerator) {
      const result = await imageGenerator(prompt, {
        width,
        height,
        num_inference_steps: 20,
        guidance_scale:      7.5,
      });
      const raw = result.images?.[0]?.data;
      if (raw) {
        buffer = await sharp(Buffer.from(raw)).resize(width, height).png().toBuffer();
      } else {
        buffer = await generatePlaceholderPng(prompt, width, height);
      }
    } else {
      buffer = await generatePlaceholderPng(prompt, width, height);
    }

    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  async generateImageBuffer(prompt: string, width = 512, height = 512): Promise<Buffer> {
    const tmp = path.join(os.tmpdir(), `adam-img-${Date.now()}.png`);
    await this.generateImage({ prompt, width, height, outputPath: tmp });
    const buffer = await fs.readFile(tmp);
    await fs.unlink(tmp).catch(() => undefined);
    return buffer;
  }

  async generateVideo(request: VideoGenerationRequest): Promise<string> {
    await this.initialize();

    const { prompt, frames = 24, fps = 12, outputPath } = request;
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    const framePaths: string[] = [];
    for (let i = 0; i < frames; i += 1) {
      const framePath = path.join(dir, `frame_${i}.png`);
      await this.generateImage({
        prompt:     `${prompt}, frame ${i + 1} of ${frames}`,
        width:      512,
        height:     512,
        outputPath: framePath,
      });
      framePaths.push(framePath);
    }

    await this.combineFramesToVideo(framePaths, outputPath, fps);

    for (const framePath of framePaths) {
      await fs.unlink(framePath).catch(() => undefined);
    }

    return outputPath;
  }

  async generateVideoBuffer(prompt: string, frames = 12, fps = 8): Promise<Buffer> {
    const tmp = path.join(os.tmpdir(), `adam-vid-${Date.now()}.mp4`);
    try {
      await this.generateVideo({ prompt, frames, fps, outputPath: tmp });
      return await fs.readFile(tmp);
    } catch {
      return this.generateImageBuffer(prompt);
    } finally {
      await fs.unlink(tmp).catch(() => undefined);
    }
  }

  private async combineFramesToVideo(
    framePaths: string[],
    outputPath: string,
    fps: number,
  ): Promise<void> {
    if (framePaths.length === 0) {
      throw new Error('No frames to combine');
    }

    const framePattern = framePaths[0].replace(/_\d+\.png$/, '_%d.png');
    try {
      await execAsync(
        `ffmpeg -y -framerate ${fps} -i "${framePattern}" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`,
      );
    } catch {
      // ffmpeg unavailable — write first frame as PNG fallback renamed to output
      await fs.copyFile(framePaths[0], outputPath.replace(/\.mp4$/, '.png'));
      throw new Error('ffmpeg not available — video export requires local ffmpeg');
    }
  }
}

export const localVisionEngine = new LocalVisionEngine();

export async function extractImageTags(imagePath: string): Promise<string[]> {
  await localVisionEngine.initialize();

  if (imageClassifier) {
    const result = await imageClassifier(imagePath);
    return result.slice(0, 5).map((r) => r.label);
  }

  const meta = await sharp(imagePath).metadata();
  return [
    meta.format ?? 'image',
    `${meta.width ?? 0}x${meta.height ?? 0}`,
    'local-ul-descriptor',
  ];
}

export function isLocalVisionConfigured(): boolean {
  return ENV.ADAM_MEDIA_GENERATION_ENABLED;
}

export function snapVideoDuration(seconds: number): number {
  const cap = ENV.ADAM_MEDIA_MAX_VIDEO_SECONDS;
  const clamped = Math.max(1, Math.min(seconds, cap));
  if (cap <= 5) return Math.min(clamped, 5);
  if (clamped <= 5) return 5;
  if (clamped <= 10) return 10;
  return cap;
}

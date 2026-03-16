/**
 * storage.service.ts
 *
 * File storage using the local filesystem.
 * On Render, mount a Persistent Disk at /var/data so files survive deploys.
 * Locally, files are written to ./uploads (gitignored).
 *
 * Files are served publicly via Express static middleware at /uploads/*
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Base directory — use Render persistent disk path in production, local otherwise
export const UPLOAD_DIR =
  process.env.NODE_ENV === 'production'
    ? '/var/data/uploads'
    : path.join(process.cwd(), 'uploads');

// Ensure directories exist on startup
['applications', 'agreements'].forEach((sub) => {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export interface UploadResult {
  key: string;   // relative path: e.g. "applications/uuid.jpg"
  url: string;   // public URL:    e.g. "https://…/uploads/applications/uuid.jpg"
}

function buildUrl(key: string): string {
  const base =
    process.env.APP_URL ||
    `http://localhost:${process.env.PORT || 4000}`;
  return `${base}/uploads/${key}`;
}

// ── Upload a photo ────────────────────────────────────────────────────────────
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  _mimetype: string,
  folder = 'applications'
): Promise<UploadResult> {
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${uuidv4()}${ext}`;
  const key = `${folder}/${filename}`;
  const fullPath = path.join(UPLOAD_DIR, key);

  await fs.promises.writeFile(fullPath, buffer);
  return { key, url: buildUrl(key) };
}

// ── Upload a PDF ──────────────────────────────────────────────────────────────
export async function uploadPDF(
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const key = `agreements/${filename}`;
  const fullPath = path.join(UPLOAD_DIR, key);

  await fs.promises.writeFile(fullPath, buffer);
  return { key, url: buildUrl(key) };
}

// ── Get a direct URL for a stored file ───────────────────────────────────────
export function getFileUrl(key: string): string {
  return buildUrl(key);
}

// ── Delete a stored file ──────────────────────────────────────────────────────
export async function deleteFile(key: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, key);
  try {
    await fs.promises.unlink(fullPath);
  } catch {
    // Ignore if file doesn't exist
  }
}

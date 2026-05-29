/**
 * ============================================================
 * QIUBBX MANAGEMENT SYSTEM
 * ============================================================
 * Module      : ADAM Consult Routes (Founder)
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-05-29
 * ============================================================
 */

import { Hono } from 'hono';
import { requireFounder } from '../../middleware/auth.middleware';
import {
  listAllConsults,
  listPendingConsults,
  resolveConsult,
} from '../../adam/adam-consult.service';
import {
  getOrCreateGroupSession,
  loadMessageHistory,
} from '../../adam/adam-chat.service';

const router = new Hono();

// GET /api/adam/consults — all consult flags
router.get('/', requireFounder, async (c) => {
  const pending = c.req.query('pending') === 'true';
  const consults = pending ? await listPendingConsults(50) : await listAllConsults(50);
  return c.json({
    success: true,
    consults,
    total:   consults.length,
    kernel:  'QXK24',
  });
});

// POST /api/adam/consults/:id/resolve
router.post('/:id/resolve', requireFounder, async (c) => {
  const consultId = c.req.param('id') ?? '';
  const ok = await resolveConsult(consultId);
  if (!ok) {
    return c.json({ success: false, error: 'Consult not found.', kernel: 'QXK24' }, 404);
  }
  return c.json({ success: true, consultId, kernel: 'QXK24' });
});

// GET /api/adam/consults/group/history — Founder read-only group chat
router.get('/group/history', requireFounder, async (c) => {
  const sessionId = await getOrCreateGroupSession();
  const messages = await loadMessageHistory(sessionId, 100);
  return c.json({
    success: true,
    messages,
    sessionId,
    readOnly: true,
    kernel:   'QXK24',
  });
});

export default router;

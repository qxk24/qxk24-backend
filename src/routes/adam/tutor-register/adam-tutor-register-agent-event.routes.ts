/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Event Routes
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-07-01
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
import { getTokenUser, requireFounderOrPlatformAdmin } from '../../../middleware/auth.middleware';
import {
  getTutorAgent,
  requireTutorAgent,
} from '../../../adam/tutor/adam-tutor-agent-auth.middleware';
import { TutorAgentEventLocationType, TutorAgentEventStatus } from '../../../adam/tutor/adam-tutor-agent-event.schema';
import { TutorAgentEventRsvpStatus } from '../../../adam/tutor/adam-tutor-agent-event-rsvp.schema';
import {
  submitTutorAgentProspectLead,
  listAdminTutorAgentProspectLeads,
} from '../../../adam/tutor/adam-tutor-agent-prospect.service';
import { TutorAgentProspectInterest } from '../../../adam/tutor/adam-tutor-agent-prospect.schema';
import {
  checkTutorAgentEventViewerEligibility,
  createTutorAgentEvent,
  expireTutorAgentEventLiveIfPastEnd,
  getAgentRsvpForEvent,
  getFeaturedTutorAgentEvent,
  getPublishedTutorAgentEvent,
  listAdminTutorAgentEvents,
  listPublishedTutorAgentEvents,
  listTutorAgentEventRsvps,
  clearTutorAgentEventLivekitRoom,
  deleteTutorAgentEvent,
  setTutorAgentEventLivekitRoom,
  setTutorAgentEventRsvpAttended,
  submitTutorAgentEventRsvp,
  updateTutorAgentEvent,
} from '../../../adam/tutor/adam-tutor-agent-event.service';

const router = new Hono();

function eventIdParam(c: { req: { param: (name: string) => string | undefined } }): string {
  const eventId = c.req.param('eventId');
  if (!eventId) throw new Error('Event id required.');
  return eventId;
}

const EventCreateSchema = z.object({
  title:          z.string().min(3).max(200),
  description:    z.string().max(4000).optional().nullable(),
  startsAt:       z.string().datetime({ offset: true }),
  endsAt:         z.string().datetime({ offset: true }),
  timezone:       z.string().max(80).optional(),
  locationType:   z.enum([TutorAgentEventLocationType.ONLINE, TutorAgentEventLocationType.PHYSICAL]).optional(),
  locationLabel:  z.string().max(300).optional().nullable(),
  meetingUrl:     z.string().max(500).optional().nullable(),
  capacity:       z.number().int().min(1).max(10_000).optional().nullable(),
  publish:        z.boolean().optional(),
  isFeatured:     z.boolean().optional(),
});

const EventUpdateSchema = EventCreateSchema.partial().extend({
  status: z.enum([
    TutorAgentEventStatus.DRAFT,
    TutorAgentEventStatus.PUBLISHED,
    TutorAgentEventStatus.CANCELLED,
  ]).optional(),
});

const RsvpSubmitSchema = z.object({
  contactName:  z.string().min(2).max(120),
  email:        z.string().email().max(200),
  phone:        z.string().max(40).optional().nullable(),
  organisation: z.string().max(200).optional().nullable(),
  status:       z.enum([
    TutorAgentEventRsvpStatus.GOING,
    TutorAgentEventRsvpStatus.MAYBE,
    TutorAgentEventRsvpStatus.DECLINED,
  ]),
  notes:        z.string().max(1000).optional().nullable(),
});

const AttendedSchema = z.object({
  attended: z.boolean(),
});

const ProspectLeadSchema = z.object({
  contactName:  z.string().min(2).max(120),
  email:        z.string().email().max(200),
  phone:        z.string().max(40).optional().nullable(),
  organisation: z.string().max(200).optional().nullable(),
  state:        z.string().min(2).max(80),
  interest:     z.enum([
    TutorAgentProspectInterest.EXPLORING,
    TutorAgentProspectInterest.COMMERCIAL,
    TutorAgentProspectInterest.STUDENT_CHARITY,
  ]),
  notes:        z.string().max(2000).optional().nullable(),
});

// POST /api/adam/tutor/agent/prospects — register interest before briefing is published
router.post(
  '/agent/prospects',
  zValidator('json', ProspectLeadSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const lead = await submitTutorAgentProspectLead({
        ...body,
        phone:        body.phone || undefined,
        organisation: body.organisation || undefined,
        notes:        body.notes || undefined,
      });
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { lead },
        message: 'Registration saved. We will email you when the next briefing date is confirmed.',
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save registration.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/prospects
router.get('/admin/prospects', requireFounderOrPlatformAdmin, async (c) => {
  const leads = await listAdminTutorAgentProspectLeads();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { leads },
    count:   leads.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/events — public upcoming published briefings
router.get('/agent/events', async (c) => {
  const events = await listPublishedTutorAgentEvents();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { events },
    count:   events.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/events/featured — primary RSVP landing event
router.get('/agent/events/featured', async (c) => {
  const event = await getFeaturedTutorAgentEvent();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { event },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/adam/tutor/agent/events/:eventId — public event detail
router.get('/agent/events/:eventId', async (c) => {
  try {
    const eventId = eventIdParam(c);
    const event = await getPublishedTutorAgentEvent(eventId);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    { event },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Event not found.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 404);
  }
});

// POST /api/adam/tutor/agent/events/:eventId/live-room/expire
// Public — only clears live link after scheduled endsAt (safe to call from token routes).
router.post('/agent/events/:eventId/live-room/expire', async (c) => {
  try {
    const eventId = eventIdParam(c);
    const result = await expireTutorAgentEventLiveIfPastEnd(eventId);
    return c.json({
      success: true,
      kernel:  'ALAMTOLOGI',
      data:    result,
      message: result.expired
        ? 'ADAM Stream ended — live room link cleared.'
        : 'ADAM Stream still within schedule.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not expire live room.';
    return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
  }
});

// POST /api/adam/tutor/agent/events/:eventId/rsvp — prospect or optional agent headers
router.post(
  '/agent/events/:eventId/rsvp',
  zValidator('json', RsvpSubmitSchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const body = c.req.valid('json');

      let agent = null;
      const agentCode = c.req.header('X-Tutor-Agent-Code')?.trim();
      const portalToken = c.req.header('X-Tutor-Agent-Token')?.trim();
      if (agentCode && portalToken) {
        const { resolveTutorAgent } = await import('../../../adam/tutor/adam-tutor-agent.service');
        agent = await resolveTutorAgent(agentCode, portalToken);
      }

      const rsvp = await submitTutorAgentEventRsvp(eventId, body, agent);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { rsvp },
        message: 'RSVP saved. We will email updates if the date or time changes.',
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save RSVP.';
      const status = msg.includes('full') ? 409 : 400;
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
    }
  },
);

// GET /api/adam/tutor/agent/portal/events/:eventId/rsvp — logged-in agent RSVP
router.get('/agent/portal/events/:eventId/rsvp', requireTutorAgent, async (c) => {
  const eventId = eventIdParam(c);
  const agent = getTutorAgent(c)!;
  const rsvp = await getAgentRsvpForEvent(eventId, agent);
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { rsvp },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/agent/portal/events/:eventId/rsvp — logged-in agent RSVP
router.post(
  '/agent/portal/events/:eventId/rsvp',
  requireTutorAgent,
  zValidator('json', RsvpSubmitSchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const agent = getTutorAgent(c)!;
      const body = c.req.valid('json');
      const rsvp = await submitTutorAgentEventRsvp(
        eventId,
        {
          ...body,
          contactName: body.contactName || agent.contactName,
          email:       body.email || agent.email,
        },
        agent,
      );
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { rsvp },
        message: 'RSVP saved for your Agen account.',
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save RSVP.';
      const status = msg.includes('full') ? 409 : 400;
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, status);
    }
  },
);

// GET /api/adam/tutor/admin/events
router.get('/admin/events', requireFounderOrPlatformAdmin, async (c) => {
  const events = await listAdminTutorAgentEvents();
  return c.json({
    success: true,
    kernel:  'ALAMTOLOGI',
    data:    { events },
    count:   events.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/adam/tutor/admin/events
router.post(
  '/admin/events',
  requireFounderOrPlatformAdmin,
  zValidator('json', EventCreateSchema),
  async (c) => {
    try {
      const founder = getTokenUser(c)!;
      const body = c.req.valid('json');
      const event = await createTutorAgentEvent(founder.userId, {
        ...body,
        meetingUrl: body.meetingUrl || null,
      });
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { event },
        message: 'Briefing created.',
        timestamp: new Date().toISOString(),
      }, 201);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create briefing.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// PATCH /api/adam/tutor/admin/events/:eventId
router.patch(
  '/admin/events/:eventId',
  requireFounderOrPlatformAdmin,
  zValidator('json', EventUpdateSchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const body = c.req.valid('json');
      const event = await updateTutorAgentEvent(eventId, {
        ...body,
        meetingUrl: body.meetingUrl === '' ? null : body.meetingUrl,
      });
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { event },
        message: 'Briefing updated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update briefing.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// GET /api/adam/tutor/admin/events/:eventId/rsvps
router.get(
  '/admin/events/:eventId/rsvps',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const rsvps = await listTutorAgentEventRsvps(eventId);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { rsvps },
        count:   rsvps.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load RSVPs.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// PATCH /api/adam/tutor/admin/events/:eventId/rsvps/:rsvpId
router.patch(
  '/admin/events/:eventId/rsvps/:rsvpId',
  requireFounderOrPlatformAdmin,
  zValidator('json', AttendedSchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const rsvpId = c.req.param('rsvpId');
      const body = c.req.valid('json');
      const rsvp = await setTutorAgentEventRsvpAttended(eventId, rsvpId, body.attended);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { rsvp },
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update RSVP.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

const ViewerEligibilitySchema = z.object({
  email: z.string().email().max(200),
});

const LiveRoomSchema = z.object({
  roomName: z.string().min(3).max(64),
});

// POST /api/adam/tutor/agent/events/:eventId/live/viewer-eligibility
router.post(
  '/agent/events/:eventId/live/viewer-eligibility',
  zValidator('json', ViewerEligibilitySchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const body = c.req.valid('json');
      const result = await checkTutorAgentEventViewerEligibility(eventId, body.email);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not verify access.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// PATCH /api/adam/tutor/admin/events/:eventId/live-room
router.patch(
  '/admin/events/:eventId/live-room',
  requireFounderOrPlatformAdmin,
  zValidator('json', LiveRoomSchema),
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const body = c.req.valid('json');
      const event = await setTutorAgentEventLivekitRoom(eventId, body.roomName);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { event },
        message: 'Live room linked to briefing.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not link live room.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// DELETE /api/adam/tutor/admin/events/:eventId/live-room — stop live (clear room link)
router.delete(
  '/admin/events/:eventId/live-room',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const event = await clearTutorAgentEventLivekitRoom(eventId);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { event },
        message: 'Live room stopped.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not stop live room.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/events/:eventId/live-room/stop — preferred stop (some proxies block DELETE)
router.post(
  '/admin/events/:eventId/live-room/stop',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      const event = await clearTutorAgentEventLivekitRoom(eventId);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        data:    { event },
        message: 'Live room stopped.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not stop live room.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

// POST /api/adam/tutor/admin/events/:eventId/remove — delete briefing (RSVPs included)
router.post(
  '/admin/events/:eventId/remove',
  requireFounderOrPlatformAdmin,
  async (c) => {
    try {
      const eventId = eventIdParam(c);
      await deleteTutorAgentEvent(eventId);
      return c.json({
        success: true,
        kernel:  'ALAMTOLOGI',
        message: 'Briefing removed.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not remove briefing.';
      return c.json({ success: false, error: msg, kernel: 'ALAMTOLOGI' }, 400);
    }
  },
);

export default router;

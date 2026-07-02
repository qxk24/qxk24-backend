/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor Agent Event Service
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

import crypto from 'crypto';
import {
  TutorAgentEventLocationType,
  TutorAgentEventModel,
  TutorAgentEventStatus,
  type ITutorAgentEvent,
} from './adam-tutor-agent-event.schema';
import {
  TutorAgentEventRsvpModel,
  TutorAgentEventRsvpRespondentType,
  TutorAgentEventRsvpStatus,
  type ITutorAgentEventRsvp,
} from './adam-tutor-agent-event-rsvp.schema';
import type { ITutorAgent } from './adam-tutor-agent.schema';

export function newTutorAgentEventId(): string {
  return `TUTOR-EVENT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newTutorAgentEventRsvpId(): string {
  return `TUTOR-RSVP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
}

export interface SerializedTutorAgentEvent {
  eventId:       string;
  title:         string;
  description:   string | null;
  startsAt:      string;
  endsAt:        string;
  timezone:      string;
  locationType:  TutorAgentEventLocationType;
  locationLabel: string | null;
  meetingUrl:    string | null;
  capacity:      number | null;
  status:        TutorAgentEventStatus;
  isFeatured:    boolean;
  createdBy:     string;
  publishedAt:   string | null;
  cancelledAt:   string | null;
  rsvpCounts:    { going: number; maybe: number; declined: number; total: number };
  createdAt:     string;
  updatedAt:     string;
}

export interface SerializedTutorAgentEventRsvp {
  rsvpId:         string;
  eventId:        string;
  respondentType: TutorAgentEventRsvpRespondentType;
  agentId:        string | null;
  agentCode:      string | null;
  contactName:    string;
  email:          string;
  phone:          string | null;
  organisation:   string | null;
  status:         TutorAgentEventRsvpStatus;
  notes:          string | null;
  attended:       boolean;
  respondedAt:    string;
  createdAt:      string;
  updatedAt:      string;
}

export interface CreateTutorAgentEventInput {
  title:         string;
  description?:  string | null;
  startsAt:      string;
  endsAt:        string;
  timezone?:     string;
  locationType?: TutorAgentEventLocationType;
  locationLabel?: string | null;
  meetingUrl?:   string | null;
  capacity?:     number | null;
  publish?:      boolean;
  isFeatured?:   boolean;
}

export interface UpdateTutorAgentEventInput {
  title?:         string;
  description?:   string | null;
  startsAt?:      string;
  endsAt?:        string;
  timezone?:      string;
  locationType?:  TutorAgentEventLocationType;
  locationLabel?: string | null;
  meetingUrl?:    string | null;
  capacity?:      number | null;
  status?:        TutorAgentEventStatus;
  isFeatured?:    boolean;
}

export interface SubmitTutorAgentEventRsvpInput {
  contactName:  string;
  email:        string;
  phone?:       string | null;
  organisation?: string | null;
  status:       TutorAgentEventRsvpStatus;
  notes?:       string | null;
}

function parseEventWindow(startsAt: string, endsAt: string): { start: Date; end: Date } {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date or time.');
  }
  if (end <= start) {
    throw new Error('End time must be after start time.');
  }
  return { start, end };
}

async function countRsvps(eventId: string): Promise<SerializedTutorAgentEvent['rsvpCounts']> {
  const rows = await TutorAgentEventRsvpModel.find({ eventId }).select('status').lean();
  const going = rows.filter((r) => r.status === TutorAgentEventRsvpStatus.GOING).length;
  const maybe = rows.filter((r) => r.status === TutorAgentEventRsvpStatus.MAYBE).length;
  const declined = rows.filter((r) => r.status === TutorAgentEventRsvpStatus.DECLINED).length;
  return { going, maybe, declined, total: rows.length };
}

async function serializeEvent(
  doc: ITutorAgentEvent,
  includeCounts = false,
): Promise<SerializedTutorAgentEvent> {
  const counts = includeCounts ? await countRsvps(doc.eventId) : { going: 0, maybe: 0, declined: 0, total: 0 };
  return {
    eventId:       doc.eventId,
    title:         doc.title,
    description:   doc.description,
    startsAt:      doc.startsAt.toISOString(),
    endsAt:        doc.endsAt.toISOString(),
    timezone:      doc.timezone,
    locationType:  doc.locationType,
    locationLabel: doc.locationLabel,
    meetingUrl:    doc.status === TutorAgentEventStatus.PUBLISHED ? doc.meetingUrl : null,
    capacity:      doc.capacity,
    status:        doc.status,
    isFeatured:    doc.isFeatured,
    createdBy:     doc.createdBy,
    publishedAt:   doc.publishedAt?.toISOString() ?? null,
    cancelledAt:   doc.cancelledAt?.toISOString() ?? null,
    rsvpCounts:    counts,
    createdAt:     doc.createdAt.toISOString(),
    updatedAt:     doc.updatedAt.toISOString(),
  };
}

function serializeRsvp(doc: ITutorAgentEventRsvp): SerializedTutorAgentEventRsvp {
  return {
    rsvpId:         doc.rsvpId,
    eventId:        doc.eventId,
    respondentType: doc.respondentType,
    agentId:        doc.agentId,
    agentCode:      doc.agentCode,
    contactName:    doc.contactName,
    email:          doc.email,
    phone:          doc.phone,
    organisation:   doc.organisation,
    status:         doc.status,
    notes:          doc.notes,
    attended:       doc.attended,
    respondedAt:    doc.respondedAt.toISOString(),
    createdAt:      doc.createdAt.toISOString(),
    updatedAt:      doc.updatedAt.toISOString(),
  };
}

async function clearOtherFeatured(eventId: string): Promise<void> {
  await TutorAgentEventModel.updateMany(
    { eventId: { $ne: eventId }, isFeatured: true },
    { $set: { isFeatured: false } },
  );
}

async function requireEvent(eventId: string): Promise<ITutorAgentEvent> {
  const event = await TutorAgentEventModel.findOne({ eventId });
  if (!event) throw new Error('Event not found.');
  return event;
}

export async function listAdminTutorAgentEvents(): Promise<SerializedTutorAgentEvent[]> {
  const rows = await TutorAgentEventModel.find().sort({ startsAt: -1 }).lean();
  return Promise.all(rows.map((row) => serializeEvent(row as unknown as ITutorAgentEvent, true)));
}

export async function listPublishedTutorAgentEvents(): Promise<SerializedTutorAgentEvent[]> {
  const now = new Date();
  const rows = await TutorAgentEventModel.find({
    status: TutorAgentEventStatus.PUBLISHED,
    endsAt: { $gte: now },
  }).sort({ startsAt: 1 }).lean();
  return Promise.all(rows.map((row) => serializeEvent(row as unknown as ITutorAgentEvent, true)));
}

export async function getFeaturedTutorAgentEvent(): Promise<SerializedTutorAgentEvent | null> {
  const now = new Date();
  const featured = await TutorAgentEventModel.findOne({
    status:     TutorAgentEventStatus.PUBLISHED,
    isFeatured: true,
    endsAt:     { $gte: now },
  }).sort({ startsAt: 1 });
  if (featured) return serializeEvent(featured, true);

  const next = await TutorAgentEventModel.findOne({
    status:   TutorAgentEventStatus.PUBLISHED,
    endsAt:   { $gte: now },
  }).sort({ startsAt: 1 });
  return next ? serializeEvent(next, true) : null;
}

export async function getPublishedTutorAgentEvent(
  eventId: string,
): Promise<SerializedTutorAgentEvent> {
  const event = await requireEvent(eventId);
  if (event.status !== TutorAgentEventStatus.PUBLISHED) {
    throw new Error('This briefing is not open for RSVP.');
  }
  return serializeEvent(event, true);
}

export async function createTutorAgentEvent(
  createdBy: string,
  input: CreateTutorAgentEventInput,
): Promise<SerializedTutorAgentEvent> {
  const { start, end } = parseEventWindow(input.startsAt, input.endsAt);
  const publish = Boolean(input.publish);
  const eventId = newTutorAgentEventId();

  if (input.isFeatured && publish) {
    await clearOtherFeatured(eventId);
  }

  const doc = await TutorAgentEventModel.create({
    eventId,
    title:         input.title.trim(),
    description:   input.description?.trim() || null,
    startsAt:      start,
    endsAt:        end,
    timezone:      input.timezone?.trim() || 'Asia/Kuala_Lumpur',
    locationType:  input.locationType ?? TutorAgentEventLocationType.ONLINE,
    locationLabel: input.locationLabel?.trim() || null,
    meetingUrl:    input.meetingUrl?.trim() || null,
    capacity:      input.capacity ?? null,
    status:        publish ? TutorAgentEventStatus.PUBLISHED : TutorAgentEventStatus.DRAFT,
    isFeatured:    Boolean(input.isFeatured),
    createdBy,
    publishedAt:   publish ? new Date() : null,
  });

  return serializeEvent(doc, true);
}

export async function updateTutorAgentEvent(
  eventId: string,
  input: UpdateTutorAgentEventInput,
): Promise<SerializedTutorAgentEvent> {
  const event = await requireEvent(eventId);

  if (input.title !== undefined) event.title = input.title.trim();
  if (input.description !== undefined) event.description = input.description?.trim() || null;
  if (input.startsAt !== undefined || input.endsAt !== undefined) {
    const { start, end } = parseEventWindow(
      input.startsAt ?? event.startsAt.toISOString(),
      input.endsAt ?? event.endsAt.toISOString(),
    );
    event.startsAt = start;
    event.endsAt = end;
  }
  if (input.timezone !== undefined) event.timezone = input.timezone.trim() || 'Asia/Kuala_Lumpur';
  if (input.locationType !== undefined) event.locationType = input.locationType;
  if (input.locationLabel !== undefined) event.locationLabel = input.locationLabel?.trim() || null;
  if (input.meetingUrl !== undefined) event.meetingUrl = input.meetingUrl?.trim() || null;
  if (input.capacity !== undefined) event.capacity = input.capacity;

  if (input.status === TutorAgentEventStatus.PUBLISHED && event.status !== TutorAgentEventStatus.PUBLISHED) {
    event.status = TutorAgentEventStatus.PUBLISHED;
    event.publishedAt = new Date();
    event.cancelledAt = null;
  } else if (input.status === TutorAgentEventStatus.CANCELLED) {
    event.status = TutorAgentEventStatus.CANCELLED;
    event.cancelledAt = new Date();
    event.isFeatured = false;
  } else if (input.status === TutorAgentEventStatus.DRAFT) {
    event.status = TutorAgentEventStatus.DRAFT;
    event.isFeatured = false;
  }

  if (input.isFeatured !== undefined) {
    event.isFeatured = input.isFeatured;
    if (input.isFeatured) {
      if (event.status !== TutorAgentEventStatus.PUBLISHED) {
        throw new Error('Only published briefings can be featured on the RSVP page.');
      }
      await clearOtherFeatured(eventId);
    }
  }

  await event.save();
  return serializeEvent(event, true);
}

export async function listTutorAgentEventRsvps(
  eventId: string,
): Promise<SerializedTutorAgentEventRsvp[]> {
  await requireEvent(eventId);
  const rows = await TutorAgentEventRsvpModel.find({ eventId })
    .sort({ respondedAt: -1 })
    .lean();
  return rows.map((row) => serializeRsvp(row as unknown as ITutorAgentEventRsvp));
}

export async function setTutorAgentEventRsvpAttended(
  eventId: string,
  rsvpId: string,
  attended: boolean,
): Promise<SerializedTutorAgentEventRsvp> {
  const rsvp = await TutorAgentEventRsvpModel.findOne({ eventId, rsvpId });
  if (!rsvp) throw new Error('RSVP not found.');
  rsvp.attended = attended;
  await rsvp.save();
  return serializeRsvp(rsvp);
}

export async function submitTutorAgentEventRsvp(
  eventId: string,
  input: SubmitTutorAgentEventRsvpInput,
  agent?: ITutorAgent | null,
): Promise<SerializedTutorAgentEventRsvp> {
  const event = await requireEvent(eventId);
  if (event.status !== TutorAgentEventStatus.PUBLISHED) {
    throw new Error('This briefing is not open for RSVP.');
  }
  if (event.endsAt < new Date()) {
    throw new Error('This briefing has already ended.');
  }

  const email = input.email.trim().toLowerCase();
  const contactName = input.contactName.trim();
  if (!contactName) throw new Error('Name is required.');
  if (!email || !email.includes('@')) throw new Error('A valid email is required.');

  const goingCount = await TutorAgentEventRsvpModel.countDocuments({
    eventId,
    status: TutorAgentEventRsvpStatus.GOING,
  });
  if (
    event.capacity
    && input.status === TutorAgentEventRsvpStatus.GOING
    && goingCount >= event.capacity
  ) {
    const existing = await TutorAgentEventRsvpModel.findOne({ eventId, email });
    if (!existing || existing.status !== TutorAgentEventRsvpStatus.GOING) {
      throw new Error('This briefing is full. Choose Maybe or Cannot attend.');
    }
  }

  const payload = {
    respondentType: agent
      ? TutorAgentEventRsvpRespondentType.AGENT
      : TutorAgentEventRsvpRespondentType.PROSPECT,
    agentId:        agent?.agentId ?? null,
    agentCode:      agent?.agentCode ?? null,
    contactName,
    email,
    phone:          input.phone?.trim() || null,
    organisation:   input.organisation?.trim() || null,
    status:         input.status,
    notes:          input.notes?.trim() || null,
    respondedAt:    new Date(),
  };

  const existing = await TutorAgentEventRsvpModel.findOne({ eventId, email });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return serializeRsvp(existing);
  }

  const created = await TutorAgentEventRsvpModel.create({
    rsvpId: newTutorAgentEventRsvpId(),
    eventId,
    ...payload,
  });
  return serializeRsvp(created);
}

export async function getAgentRsvpForEvent(
  eventId: string,
  agent: ITutorAgent,
): Promise<SerializedTutorAgentEventRsvp | null> {
  const row = await TutorAgentEventRsvpModel.findOne({
    eventId,
    $or: [{ agentId: agent.agentId }, { email: agent.email.toLowerCase() }],
  }).sort({ respondedAt: -1 });
  return row ? serializeRsvp(row) : null;
}

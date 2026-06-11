/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module : ADAMGuru — Lightweight Context Builder
 * Platform : Backend (TypeScript)
 * QXK24 : Kernel v1.7.0
 * Founder : Masa Bayu
 * Created : 2026-06-09
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { LlmMessage } from '../llm/llm-types';
import { getAdamMemoryConfig } from '../config/adam-memory.config';
import { loadMessageHistory } from './adam-chat-session.service';
import { loadGuruLaneDigest } from './adam-guru-lane.service';
import { getGuruProfile } from './adam-guru-profile.service';
import {
  ADAMGURU_SLEEP_LISTENING,
  buildGuruLaneContextBlock,
  buildGuruProfileContextBlock,
} from './adam-guru-prompts';
import type { GuruKelasContext } from './adam-guru-types';

export async function buildGuruKelasContext(
  kelas: GuruKelasContext,
  speakerName: string,
  newMessage: string,
): Promise<LlmMessage[]> {
  const config = getAdamMemoryConfig('guru', false, 'QUESTIONING');
  const history = await loadMessageHistory(kelas.sessionId, config.MESSAGE_WINDOW);
  const laneDigest = await loadGuruLaneDigest(kelas.kelasId);
  const guruProfile = await getGuruProfile(kelas.guruId);

  const messages: LlmMessage[] = [];

  if (guruProfile?.profileComplete) {
    messages.push({
      role:    'user',
      content: buildGuruProfileContextBlock(guruProfile),
    });
    messages.push({
      role:    'assistant',
      content: `I know who ${guruProfile.fullName} is and what they teach. I will honour their lane in this kelas.`,
    });
  }

  messages.push({
    role:    'user',
    content: buildGuruLaneContextBlock({
      guruName:   kelas.guruName,
      subject:    kelas.subject,
      title:      kelas.title,
      laneDigest,
    }),
  });
  messages.push({
    role:    'assistant',
    content: 'Understood. I carry what this guru taught me. I will educate students freshly — same ADAM voice, this lane only.',
  });

  messages.push({
    role:    'user',
    content: ADAMGURU_SLEEP_LISTENING,
  });
  messages.push({
    role:    'assistant',
    content: 'Understood. When I sleep in this kelas I stay present and monitor — silent, not absent. The transcript is my awareness.',
  });

  for (const m of history) {
    if (m.role === 'adam') {
      messages.push({ role: 'assistant', content: m.content });
    } else {
      const name = m.speakerName?.trim() || 'Participant';
      messages.push({ role: 'user', content: `[${name}]: ${m.content}` });
    }
  }

  if (newMessage.trim()) {
    messages.push({
      role:    'user',
      content: `[${speakerName}]: ${newMessage.trim()}`,
    });
  }

  return messages;
}

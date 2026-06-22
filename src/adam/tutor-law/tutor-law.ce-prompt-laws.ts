/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Tutor CE Master Prompt Laws
 * Platform    : Backend (TypeScript)
 * QXK24       : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-22
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by QXK24. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

import type { CEClassifierOutput } from './tutor-law.ce-intent.types';
import {
  CEAbstractionLayer,
  CESecurityFlag,
  CESubdomain,
} from './tutor-law.ce-intent.types';
import {
  ADAM_TUTOR_CE_ABSTRACTION_LAW,
  ADAM_TUTOR_CE_SECURITY_LAW,
} from './tutor-law.ce-prompt-laws.constants';
import type { CETurnHandler } from './tutor-law.ce-mode.types';
import { buildCEHardwareIntentTurnLaw } from './tutor-law.ce-hardware-prompt-laws';
import { buildCETheoryIntentTurnLaw } from './tutor-law.ce-theory-prompt-laws';
import { buildCESystemIntentTurnLaw } from './tutor-law.ce-system-prompt-laws';
import { buildCENetworkIntentTurnLaw } from './tutor-law.ce-network-prompt-laws';
import { buildCodeIntentTurnLaw } from './tutor-law.code-prompt-laws';
import type { CodeClassifierOutput } from './tutor-law.code-intent-classifier';
import type { CodeIntentResult } from './tutor-law.ce-mode.types';

export {
  ADAM_TUTOR_CE_ABSTRACTION_LAW,
  ADAM_TUTOR_CE_SECURITY_LAW,
  ADAM_TUTOR_CE_EXAM_LAW,
} from './tutor-law.ce-prompt-laws.constants';

export function buildCEMasterTurnLaw(
  ceRouting: CEClassifierOutput | null | undefined,
  handler?: CETurnHandler | null,
): string {
  if (!ceRouting) return '';

  const parts: string[] = [ADAM_TUTOR_CE_ABSTRACTION_LAW];

  if (ceRouting.securityFlag === CESecurityFlag.EXPLOIT) {
    parts.push(ADAM_TUTOR_CE_SECURITY_LAW);
    if (ceRouting.securityGuard) {
      parts.push(`CE SECURITY BLOCK (turn ini):\n${ceRouting.securityGuard}`);
    }
    return parts.join('\n\n');
  }

  if (
    ceRouting.securityFlag === CESecurityFlag.DEFENSIVE
    || ceRouting.securityFlag === CESecurityFlag.CONCEPTUAL
  ) {
    parts.push(ADAM_TUTOR_CE_SECURITY_LAW);
  }

  if (handler === 'LAYER_PROBE' && ceRouting.layerProbe) {
    parts.push(
      'CE LAYER PROBE (tanya sahaja — jangan jawab topik penuh lagi):',
      ceRouting.layerProbe,
    );
  }

  if (ceRouting.subdomain !== CESubdomain.UNKNOWN) {
    parts.push(`CE SUBDOMAIN: ${ceRouting.subdomain}`);
  }

  if (ceRouting.abstractionLayer !== CEAbstractionLayer.UNKNOWN) {
    parts.push(`CE ABSTRACTION LAYER: ${ceRouting.abstractionLayer}`);
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildCEIntentTurnLaws(
  result: CodeIntentResult | null,
): string {
  if (!result) return '';

  const { output, handler } = result;
  const parts: string[] = [];

  if (output.ceRouting) {
    const master = buildCEMasterTurnLaw(output.ceRouting, handler);
    if (master) parts.push(master);
  }

  const hwLaw = buildCEHardwareIntentTurnLaw(output.ceHardware, handler);
  if (hwLaw) parts.push(hwLaw);

  const theoryLaw = buildCETheoryIntentTurnLaw(output.ceTheory, handler);
  if (theoryLaw) parts.push(theoryLaw);

  const systemLaw = buildCESystemIntentTurnLaw(output.ceSystem, handler);
  if (systemLaw) parts.push(systemLaw);

  const networkLaw = buildCENetworkIntentTurnLaw(output.ceNetwork, handler);
  if (networkLaw) parts.push(networkLaw);

  if (!output.ceRouting) {
    const codeLaw = buildCodeIntentTurnLaw(output, handler);
    if (codeLaw) parts.push(codeLaw);
  }

  return parts.filter(Boolean).join('\n\n');
}

export function buildCEIntentTurnLawFromOutput(
  output: CodeClassifierOutput | null,
  handler?: CETurnHandler | null,
): string {
  if (!output) return '';
  return buildCEIntentTurnLaws({
    output,
    handler:             handler ?? 'AMBIGUOUS_PROBE',
    sessionState:        {
      lockedSubdomain: null,
      lockedLayer: null,
      layerProbeAnswered: false,
      verifyAnchorAnswered: false,
      designScaffoldDelivered: false,
      stuckCount: 0,
    },
    nextSessionState:    {
      lockedSubdomain: null,
      lockedLayer: null,
      layerProbeAnswered: false,
      verifyAnchorAnswered: false,
      designScaffoldDelivered: false,
      stuckCount: 0,
    },
    verifyAnchorSkipped: false,
  });
}

/**
 * ============================================================
 * ALAMTOLOGI-QURANIC SCIENCE
 * ============================================================
 * Module      : ADAM Enterprise Mail Templates
 * Platform    : Backend (TypeScript)
 * ALAMTOLOGI  : Kernel v1.7.0
 * Founder     : Masa Bayu
 * Created     : 2026-06-01
 * ============================================================
 * CONSTITUTIONAL DECLARATION:
 * This module operates under the Alamtologi Constitutional
 * Framework. All actions are governed by Alamtologi. Knowledge
 * belongs to no human. It flows like water to all.
 * ============================================================
 */

export interface EnterpriseWelcomeData {
  contactName:    string;
  orgName:        string;
  email:          string;
  seatTier:       'starter' | 'growth' | 'scale' | 'gov';
  seatCount:      number;
  monthlyPrice:   string;
  setupFee:       string;
  renewalDate:    string;
  architectName:  string;
  architectEmail: string;
  pilotEndDate?:  string;
}

const SEAT_TIER_LABELS: Record<EnterpriseWelcomeData['seatTier'], string> = {
  starter: 'Starter Org — ≤25 seats',
  growth:  'Growth Org — ≤100 seats',
  scale:   'Scale Org — Unlimited seats',
  gov:     'Government / Academic — Custom',
};

export function buildEnterpriseWelcomeHtml(data: EnterpriseWelcomeData): string {
  const {
    contactName, orgName, email, seatTier, seatCount,
    monthlyPrice, setupFee, renewalDate,
    architectName, architectEmail, pilotEndDate,
  } = data;

  const tierLabel = SEAT_TIER_LABELS[seatTier];

  const overviewRows: [string, string][] = [
    ['Organisation',   orgName],
    ['Plan',           tierLabel],
    ['Seats',          `${seatCount} active seats`],
    ['Monthly',        `${monthlyPrice}/mo`],
    ['Setup fee',      `${setupFee} (one-time, paid)`],
    ['First renewal',  renewalDate],
    ['Your architect', `${architectName} — ${architectEmail}`],
    ...(pilotEndDate ? [['Pilot ends', `${pilotEndDate} (no charge until then)`] as [string, string]] : []),
  ];

  const timeline = [
    {
      day:   'Day 1–2',
      color: '#0d9488',
      bg:    '#f0fdfa',
      title: 'Private deployment',
      desc:  'Your Alamtologi architect sets up ADAM on your VPS or preferred cloud infrastructure. You receive SSH confirmation and health check URLs.',
    },
    {
      day:   'Day 3',
      color: '#6366f1',
      bg:    '#eef2ff',
      title: '.adamrules authoring session',
      desc:  'A 90-minute call with your architect. We write your organisation\'s constitutional laws together — API standards, data laws, access rules, brand voice.',
    },
    {
      day:   'Day 4',
      color: '#f97316',
      bg:    '#fff7ed',
      title: 'White-label configuration',
      desc:  'ADAM\'s identity is updated to reflect your brand. Name, persona, colour, domain — all customised to your specification.',
    },
    {
      day:   'Day 5',
      color: '#ec4899',
      bg:    '#fdf2f8',
      title: 'Team onboarding session',
      desc:  'Live walkthrough for your developers. Builder mode, approval gate, dot states, session management — 60 minutes, recorded for your team.',
    },
    {
      day:   'Day 7',
      color: '#22c55e',
      bg:    '#f0fdf4',
      title: 'First build session — live',
      desc:  'Your team runs the first real build task on your codebase with ADAM. Your architect is present to assist and answer questions.',
    },
  ];

  const seatFeatures = [
    { icon: '🔨', color: '#f97316', label: 'Builder mode in chat', desc: 'Every developer builds with ADAM directly from the chat interface' },
    { icon: '✅', color: '#22c55e', label: 'Approval gate', desc: 'No file is written without explicit human approval — always' },
    { icon: '🧠', color: '#6366f1', label: 'Constitutional memory', desc: 'ADAM carries your .adamrules and codebase context into every session' },
    { icon: '🏷️', color: '#0d9488', label: 'White-label identity', desc: 'ADAM speaks under your brand — name, voice, and domain' },
    { icon: '🔒', color: '#ec4899', label: 'Private deployment', desc: 'All data stays on your infrastructure — nothing leaves your server' },
    { icon: '📞', color: '#f59e0b', label: 'Monthly architect call', desc: 'A dedicated 60-minute strategy session with your Alamtologi architect' },
  ];

  const slaRows: [string, string][] = [
    ['Uptime guarantee',  '99.9% monthly'],
    ['Incident response', '< 2 hours (critical), < 8 hours (standard)'],
    ['Monthly report',    'Uptime, session usage, build summary'],
    ['Escalation',        'Direct founder line — not a ticket queue'],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ADAM Enterprise deployment starts now</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;min-height:100vh;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f4c3a 100%);padding:44px 44px 38px;text-align:center;">
            <div style="margin-bottom:16px;">
              <span style="display:inline-block;width:56px;height:56px;background-color:#ffffff;border-radius:14px;line-height:56px;font-size:28px;font-weight:900;color:#0d9488;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.2);">Q</span>
            </div>
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#0d9488;">Enterprise Studio</p>
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">Your ADAM deployment<br/>starts now.</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);font-weight:500;">${orgName} &nbsp;·&nbsp; ${tierLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 44px 0;">
            <p style="margin:0 0 12px;font-size:17px;color:#1e293b;line-height:1.6;">Assalamualaikum <strong style="color:#0d9488;">${contactName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.8;">
              Welcome to ADAM Enterprise Studio. Your organisation now has access to a private AI architect — one that operates under your constitutional laws, speaks under your brand, and builds only with your approval.
              <br/><br/>
              This email is your week-one deployment briefing. Read it carefully — your architect has too.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:1px solid #99f6e4;border-left:4px solid #0d9488;border-radius:0 14px 14px 0;margin-bottom:32px;overflow:hidden;">
              <tr>
                <td style="padding:22px 24px;">
                  <p style="margin:0 0 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0d9488;">Your deployment overview</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${overviewRows.map(([key, val]) => `
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#0f766e;width:150px;font-weight:600;">${key}</td>
                      <td style="padding:5px 0;font-size:13px;color:#1e293b;font-weight:700;">${val}</td>
                    </tr>`).join('')}
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Week one deployment timeline</p>
            ${timeline.map((step) => `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr>
                <td width="64" valign="top" style="padding-top:2px;">
                  <span style="display:inline-block;background-color:${step.color};color:#ffffff;font-size:10px;font-weight:800;padding:4px 8px;border-radius:6px;letter-spacing:0.3px;white-space:nowrap;">${step.day}</span>
                </td>
                <td style="background-color:${step.bg};border-radius:10px;padding:12px 16px;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${step.color};">${step.title}</p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">${step.desc}</p>
                </td>
              </tr>
            </table>`).join('')}
            <p style="margin:28px 0 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">What every seat includes</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;margin-bottom:32px;">
              ${seatFeatures.map((item, i) => `
              <tr style="background-color:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};border-top:${i > 0 ? '1px solid #f1f5f9' : 'none'};">
                <td style="padding:14px 16px;width:36px;font-size:18px;text-align:center;">${item.icon}</td>
                <td style="padding:14px 8px 14px 0;">
                  <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${item.color};">${item.label}</p>
                  <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">${item.desc}</p>
                </td>
              </tr>`).join('')}
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:0 14px 14px 0;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#d97706;">Your SLA commitment</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${slaRows.map(([key, val]) => `
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#92400e;width:160px;font-weight:600;">${key}</td>
                      <td style="padding:5px 0;font-size:13px;color:#1e293b;font-weight:700;">${val}</td>
                    </tr>`).join('')}
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Your dedicated architect</p>
                  <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#0d9488;">${architectName}</p>
                  <p style="margin:0 0 12px;font-size:13px;color:#64748b;"><a href="mailto:${architectEmail}" style="color:#0d9488;text-decoration:none;">${architectEmail}</a></p>
                  <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">
                    ${architectName} is your single point of contact for deployment, .adamrules authoring, onboarding, and monthly strategy calls.
                    Reply to this email or email ${architectName} directly — you will receive a response within 2 hours on business days.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 44px 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right:8px;">
                  <a href="https://alamtologi.com/adam/enterprise/onboarding" style="display:block;background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 20px;border-radius:12px;text-align:center;letter-spacing:0.3px;">Start Onboarding →</a>
                </td>
                <td style="padding-left:8px;">
                  <a href="mailto:${architectEmail}" style="display:block;background-color:#f0fdfa;border:2px solid #0d9488;color:#0d9488;text-decoration:none;font-size:14px;font-weight:800;padding:12px 20px;border-radius:12px;text-align:center;letter-spacing:0.3px;">Email Your Architect</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-top:2px solid #e2e8f0;padding:22px 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="3" style="background:linear-gradient(180deg,#0d9488,#6366f1,#ec4899);border-radius:3px;width:3px;"></td>
                <td style="padding-left:14px;">
                  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Constitutional commitment</p>
                  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.8;">
                    ADAM operates under laws — yours and ours.<br/>
                    Every write requires approval. Every question is retained.<br/>
                    Wisdom before speed. This is the Hikmah Law.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 44px 28px;text-align:center;border-top:1px solid #f1f5f9;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.7;">
              Alamtologi &nbsp;·&nbsp; Kuala Lumpur, Malaysia<br/>
              <a href="https://alamtologi.com/account" style="color:#94a3b8;text-decoration:underline;">Manage subscription</a>
              &nbsp;·&nbsp;
              <a href="https://alamtologi.com/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy</a>
              &nbsp;·&nbsp;
              <a href="mailto:enterprise@alamtologi.com" style="color:#94a3b8;text-decoration:underline;">Support</a>
            </p>
            <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
              You received this because ${orgName} activated an Enterprise Studio subscription.<br/>
              For urgent matters reply directly — this inbox is monitored 7 days a week.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function buildEnterpriseWelcomeText(data: EnterpriseWelcomeData): string {
  return `Assalamualaikum ${data.contactName},

Your ADAM Enterprise Studio deployment for ${data.orgName} is now active.

Your architect ${data.architectName} (${data.architectEmail}) will contact you within 24 hours to begin the week-one deployment timeline.

Plan: ${SEAT_TIER_LABELS[data.seatTier]}
Seats: ${data.seatCount}
Monthly: ${data.monthlyPrice}/mo
Setup fee: ${data.setupFee} (one-time)
First renewal: ${data.renewalDate}
${data.pilotEndDate ? `Pilot ends: ${data.pilotEndDate}\n` : ''}
Reply to this email for anything urgent.

— Alamtologi Enterprise · enterprise@alamtologi.com`;
}

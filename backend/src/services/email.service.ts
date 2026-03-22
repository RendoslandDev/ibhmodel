import { Resend } from 'resend';
import { Application } from '../types';

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Base Email Template ──────────────────────────────────────────────────────
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin:0; padding:0; background:#0D0D0D; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; }
    .wrap { max-width:600px; margin:0 auto; }
    .header { background:#0D0D0D; padding:40px 40px 24px; border-bottom:1px solid #C8963E; text-align:center; }
    .brand { font-size:28px; font-weight:300; color:#FAF7F2; letter-spacing:0.15em; }
    .brand span { color:#C8963E; }
    .body { background:#141414; padding:40px; }
    .footer { background:#0D0D0D; padding:24px 40px; text-align:center; border-top:1px solid rgba(200,150,62,0.2); }
    .footer p { font-size:11px; color:#555; letter-spacing:0.05em; }
    h2 { color:#FAF7F2; font-size:22px; font-weight:300; margin:0 0 16px; }
    p { color:#888; font-size:13px; line-height:1.8; margin:0 0 12px; }
    .highlight { color:#C8963E; }
    .btn { display:inline-block; background:#C8963E; color:#0D0D0D; text-decoration:none;
           font-size:11px; font-weight:600; letter-spacing:0.25em; text-transform:uppercase;
           padding:14px 32px; margin:20px 0 0; }
    .tag { display:inline-block; background:rgba(200,150,62,0.12); border:1px solid rgba(200,150,62,0.3);
           color:#C8963E; font-size:10px; letter-spacing:0.2em; text-transform:uppercase;
           padding:6px 14px; margin-bottom:20px; }
    .divider { height:1px; background:rgba(200,150,62,0.15); margin:24px 0; }
    .info-row { display:flex; gap:8px; margin-bottom:8px; }
    .info-label { color:#555; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; min-width:120px; }
    .info-val { color:#C8C0B0; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="brand">IBH <span>COMPANY</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>IBH Company — Talent Management &amp; Representation</p>
      <p style="margin-top:6px;">This email is confidential. If received in error please disregard.</p>
    </div>
  </div>
</body>
</html>`;

// ── Helper: Safe send with logs ──────────────────────────────────────────────
async function sendEmailSafe(payload: any) {
  try {
    console.log('📧 Sending email:', {
      to: payload.to,
      subject: payload.subject,
    });

    const result = await resend.emails.send(payload);

    console.log('✅ Email sent:', result);

    return result;
  } catch (err) {
    console.error('❌ Email failed:', err);
    throw err;
  }
}

// ── Application Confirmation ─────────────────────────────────────────────────
export async function sendApplicationConfirmation(app: Application): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">Application Received</div>
    <h2>Thank you, ${app.first_name}.</h2>
    <p>Your application has been received and is under review.</p>
  `);

  await sendEmailSafe({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: `IBH Company — Application Received, ${app.first_name}`,
    html,
  });
}

// ── Admin Notification ───────────────────────────────────────────────────────
export async function sendAdminNotification(app: Application): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">New Application</div>
    <h2>${app.first_name} ${app.last_name}</h2>
    <p>Email: ${app.email}</p>
  `);

  await sendEmailSafe({
    from: process.env.EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `[IBH] New Application — ${app.first_name} ${app.last_name}`,
    html,
  });
}

// ── Agreement Email ──────────────────────────────────────────────────────────
export async function sendAgreementEmail(
  app: Application,
  pdfBuffer: Buffer
): Promise<void> {
  const html = baseTemplate(`<h2>Your Agreement</h2>`);

  await sendEmailSafe({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: `IBH Company — Agreement`,
    html,
    attachments: [
      {
        filename: `agreement.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
}

// ── Status Update ────────────────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  app: Application,
  status: string,
  notes?: string
): Promise<void> {
  const html = baseTemplate(`
    <h2>Status: ${status}</h2>
    ${notes ? `<p>${notes}</p>` : ''}
  `);

  await sendEmailSafe({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: `IBH Update — ${status}`,
    html,
  });
}
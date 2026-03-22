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

// ── Application Confirmation Email ───────────────────────────────────────────
export async function sendApplicationConfirmation(app: Application): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">Application Received</div>
    <h2>Thank you, ${app.first_name}.</h2>
    <p>Your application to join IBH Company's talent roster has been received and is now under review. We take care to evaluate every submission personally.</p>
    <div class="divider"></div>
    <p><strong style="color:#FAF7F2;">What happens next?</strong></p>
    <p>Our team will review your application within <span class="highlight">5–7 business days</span>. If your profile is a match, you will receive a follow-up email with next steps.</p>
    <div class="divider"></div>
    <div class="info-row"><span class="info-label">Name</span><span class="info-val">${app.first_name} ${app.last_name}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span class="info-val">${app.email}</span></div>
    <div class="info-row"><span class="info-label">Categories</span><span class="info-val">${app.categories.join(', ')}</span></div>
    <div class="info-row"><span class="info-label">Submitted</span><span class="info-val">${new Date(app.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span></div>
    <div class="divider"></div>
    <p style="font-size:12px;">For enquiries, reply to this email or contact us at <span class="highlight">${process.env.ADMIN_EMAIL}</span></p>
  `);

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: `IBH Company — Application Received, ${app.first_name}`,
    html,
  });
}

// ── Admin Notification Email ─────────────────────────────────────────────────
export async function sendAdminNotification(app: Application): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">New Application</div>
    <h2>New model application submitted.</h2>
    <p>A new application has been submitted via the IBH portal and is awaiting review.</p>
    <div class="divider"></div>
    <div class="info-row"><span class="info-label">Name</span><span class="info-val">${app.first_name} ${app.last_name}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span class="info-val">${app.email}</span></div>
    <div class="info-row"><span class="info-label">Phone</span><span class="info-val">${app.phone}</span></div>
    <div class="info-row"><span class="info-label">Location</span><span class="info-val">${app.location}</span></div>
    <div class="info-row"><span class="info-label">Categories</span><span class="info-val">${app.categories.join(', ')}</span></div>
    <div class="info-row"><span class="info-label">Experience</span><span class="info-val">${app.experience || '—'}</span></div>
    <div class="info-row"><span class="info-label">Photos</span><span class="info-val">${app.photo_urls.length} uploaded</span></div>
    <br/>
    <a href="${process.env.FRONTEND_URL}/admin/applications/${app.id}" class="btn">Review Application</a>
  `);

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.ADMIN_EMAIL!,
    subject: `[IBH] New Application — ${app.first_name} ${app.last_name}`,
    html,
  });
}

// ── Agreement Email with PDF Attachment ──────────────────────────────────────
export async function sendAgreementEmail(
  app: Application,
  pdfBuffer: Buffer
): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">Action Required</div>
    <h2>Your IBH Model Upfront Agreement</h2>
    <p>Congratulations, ${app.first_name}! Please find your agreement attached.</p>
    <div class="divider"></div>
    <p><strong style="color:#FAF7F2;">Next Steps</strong></p>
    <p>1. Read the agreement carefully.<br/>
       2. Sign and return it to <span class="highlight">${process.env.ADMIN_EMAIL}</span>.<br/>
       3. Await further instructions from our team.</p>
  `);

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: `IBH Company — Your Model Upfront Agreement`,
    html,
    attachments: [
      {
        filename: `IBH_Upfront_Agreement_${app.first_name}_${app.last_name}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
}

// ── Status Update Email ──────────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  app: Application,
  status: string,
  notes?: string
): Promise<void> {
  const messages: Record<string, { subject: string; body: string }> = {
    approved: {
      subject: `IBH — Great News, ${app.first_name}!`,
      body: `<div class="tag">Application Approved</div>
        <h2>You have been approved!</h2>
        <p>Your application has been <span class="highlight">approved</span>.</p>`,
    },
    rejected: {
      subject: `IBH — Application Update`,
      body: `<div class="tag">Application Update</div>
        <h2>Thank you for applying.</h2>
        <p>We are unable to move forward at this time.</p>`,
    },
    reviewing: {
      subject: `IBH — Under Review`,
      body: `<div class="tag">Under Review</div>
        <h2>Your application is being reviewed.</h2>`,
    },
    waitlisted: {
      subject: `IBH — Waitlisted`,
      body: `<div class="tag">Waitlisted</div>
        <h2>You have been waitlisted.</h2>`,
    },
  };

  const msg = messages[status];
  if (!msg) return;

  const notesBlock = notes
    ? `<div class="divider"></div><p><strong style="color:#FAF7F2;">A note from our team:</strong></p><p>${notes}</p>`
    : '';

  const html = baseTemplate(`${msg.body}${notesBlock}`);

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: app.email,
    subject: msg.subject,
    html,
  });
}
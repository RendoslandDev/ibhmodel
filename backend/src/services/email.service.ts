import nodemailer from 'nodemailer';
import { Application } from '../types';


const transporter = nodemailer.createTransport({
  service: 'gmail', // Use the built-in Gmail service shortcut
  pool: true,       // Enable pooling to keep connections alive
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

// ── Email to model on successful submission ──────────────────────────────────
export async function sendApplicationConfirmation(app: Application): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">Application Received</div>
    <h2>Thank you, ${app.first_name}.</h2>
    <p>Your application to join IBH Company's talent roster has been received and is now under review. We take care to evaluate every submission personally.</p>
    <div class="divider"></div>
    <p><strong style="color:#FAF7F2;">What happens next?</strong></p>
    <p>Our team will review your application within <span class="highlight">5–7 business days</span>. If your profile is a match, you will receive a follow-up email with next steps, including the IBH Model Upfront Agreement to review and sign.</p>
    <div class="divider"></div>
    <div class="info-row"><span class="info-label">Name</span><span class="info-val">${app.first_name} ${app.last_name}</span></div>
    <div class="info-row"><span class="info-label">Email</span><span class="info-val">${app.email}</span></div>
    <div class="info-row"><span class="info-label">Categories</span><span class="info-val">${app.categories.join(', ')}</span></div>
    <div class="info-row"><span class="info-label">Submitted</span><span class="info-val">${new Date(app.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</span></div>
    <div class="divider"></div>
    <p style="font-size:12px;">For enquiries, reply to this email or contact us at <span class="highlight">${process.env.ADMIN_EMAIL}</span></p>
  `);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: app.email,
    subject: `IBH Company — Application Received, ${app.first_name}`,
    html,
  });
}

// ── Email to admin on new submission ────────────────────────────────────────
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

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `[IBH] New Application — ${app.first_name} ${app.last_name}`,
    html,
  });
}

// ── Email agreement PDF to model ─────────────────────────────────────────────
export async function sendAgreementEmail(
  app: Application,
  pdfBuffer: Buffer
): Promise<void> {
  const html = baseTemplate(`
    <div class="tag">Action Required</div>
    <h2>Your IBH Model Upfront Agreement</h2>
    <p>Congratulations, ${app.first_name}! We are pleased to move forward with your application. Please find your IBH Model Upfront Agreement attached to this email.</p>
    <div class="divider"></div>
    <p><strong style="color:#FAF7F2;">Next Steps</strong></p>
    <p>1. Read the attached Upfront Agreement carefully.<br/>
       2. Sign and return a scanned copy to <span class="highlight">${process.env.ADMIN_EMAIL}</span>.<br/>
       3. Once received, our team will contact you to schedule your first consultation.</p>
    <div class="divider"></div>
    <p style="font-size:11px;color:#555;">This agreement does not constitute a formal employment offer. Please review all terms before signing. Contact us if you have any questions.</p>
  `);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: app.email,
    subject: `IBH Company — Your Model Upfront Agreement`,
    html,
    attachments: [
      {
        filename: `IBH_Upfront_Agreement_${app.first_name}_${app.last_name}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// ── Status update email ──────────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  app: Application,
  status: string,
  notes?: string
): Promise<void> {
  const messages: Record<string, { subject: string; body: string }> = {
    approved: {
      subject: `IBH Company — Great News, ${app.first_name}!`,
      body: `<div class="tag">Application Approved</div>
        <h2>You have been approved!</h2>
        <p>We are delighted to inform you that your application to IBH Company has been <span class="highlight">approved</span>. Welcome to the IBH family.</p>
        <p>Your Upfront Agreement will be sent to you shortly. Please look out for a separate email with the agreement attached.</p>`,
    },
    rejected: {
      subject: `IBH Company — Application Update`,
      body: `<div class="tag">Application Update</div>
        <h2>Thank you for applying.</h2>
        <p>Thank you for your interest in IBH Company. After careful review, we are unable to move forward with your application at this time.</p>
        <p>We encourage you to reapply in the future as our roster needs evolve. We wish you the very best in your modeling career.</p>`,
    },
    reviewing: {
      subject: `IBH Company — Your Application is Under Review`,
      body: `<div class="tag">Under Review</div>
        <h2>We are reviewing your application.</h2>
        <p>Your application is currently being actively reviewed by our team. We will be in touch shortly with a decision.</p>`,
    },
    waitlisted: {
      subject: `IBH Company — Application Update`,
      body: `<div class="tag">Waitlisted</div>
        <h2>You have been added to our waitlist.</h2>
        <p>Your profile is impressive and we have added you to our priority waitlist. We will reach out as soon as a position becomes available.</p>`,
    },
  };

  const msg = messages[status];
  if (!msg) return;

  const notesBlock = notes
    ? `<div class="divider"></div><p><strong style="color:#FAF7F2;">A note from our team:</strong></p><p>${notes}</p>`
    : '';

  const html = baseTemplate(`${msg.body}${notesBlock}`);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: app.email,
    subject: msg.subject,
    html,
  });
}

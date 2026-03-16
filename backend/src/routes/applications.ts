import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/pool';
import { upload } from '../middleware/upload';
import { authenticate, AuthRequest } from '../middleware/auth';
import { applicationSchema, statusUpdateSchema } from '../middleware/validate';
import { uploadFile, uploadPDF, getFileUrl } from '../services/storage.service';
import { generateAgreementPDF } from '../services/pdf.service';
import {
  sendApplicationConfirmation,
  sendAdminNotification,
  sendAgreementEmail,
  sendStatusUpdateEmail,
} from '../services/email.service';
import { Application, ApplicationFilters, PaginatedResult } from '../types';

export const applicationsRouter = Router();

applicationsRouter.post('/', upload.array('photos', 6), async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = applicationSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() }); return; }
    const data = parsed.data;
    const files = (req.files as Express.Multer.File[]) || [];
    const photoKeys: string[] = [];
    const photoUrls: string[] = [];
    for (const file of files) {
      const result = await uploadFile(file.buffer, file.originalname, file.mimetype);
      photoKeys.push(result.key);
      photoUrls.push(result.url);
    }
    const [app] = await query<Application>(
      `INSERT INTO applications (first_name,last_name,date_of_birth,gender,nationality,location,email,phone,instagram,portfolio_url,height_cm,weight_kg,bust_cm,waist_cm,hips_cm,shoe_size_eu,hair_color,eye_color,skin_tone,categories,experience,prev_agency,campaigns,bio,availability,travel_pref,hear_about,emergency_contact,photo_keys,photo_urls) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30) RETURNING *`,
      [data.first_name,data.last_name,data.date_of_birth,data.gender,data.nationality||null,data.location,data.email,data.phone,data.instagram||null,data.portfolio_url||null,data.height_cm||null,data.weight_kg||null,data.bust_cm||null,data.waist_cm||null,data.hips_cm||null,data.shoe_size_eu||null,data.hair_color||null,data.eye_color||null,data.skin_tone||null,data.categories,data.experience||null,data.prev_agency||null,data.campaigns||null,data.bio,data.availability||null,data.travel_pref||null,data.hear_about||null,data.emergency_contact||null,photoKeys,photoUrls]
    );
    sendApplicationConfirmation(app).catch(console.error);
    sendAdminNotification(app).catch(console.error);
    await query(`INSERT INTO activity_log (application_id,action,metadata) VALUES ($1,$2,$3)`, [app.id,'submitted',{ email: app.email, categories: app.categories }]);
    res.status(201).json({ message: 'Application submitted successfully', id: app.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) { res.status(409).json({ error: 'An application with this email already exists.' }); return; }
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

applicationsRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = req.query as ApplicationFilters & Record<string, string>;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    if (status) { conditions.push(`status = $${p++}`); params.push(status); }
    if (search) { conditions.push(`(first_name ILIKE $${p} OR last_name ILIKE $${p} OR email ILIKE $${p})`); params.push(`%${search}%`); p++; }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSort = ['created_at','first_name','last_name','status'].includes(String(sortBy)) ? sortBy : 'created_at';
    const dir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const countRows = await query<{ count: string }>(`SELECT COUNT(*) as count FROM applications ${where}`, params);
    const total = parseInt(countRows[0]?.count ?? '0');
    const data = await query<Application>(`SELECT * FROM applications ${where} ORDER BY ${validSort} ${dir} LIMIT $${p} OFFSET $${p+1}`, [...params, Number(limit), offset]);
    const enriched = data.map((app) => ({ ...app, photo_urls: app.photo_keys.map((k) => getFileUrl(k)) }));
    res.json({ data: enriched, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } as PaginatedResult<Application>);
  } catch (err) { console.error('List error:', err); res.status(500).json({ error: 'Failed to fetch applications' }); }
});

applicationsRouter.get('/stats', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rows = await query<{ status: string; count: string }>(`SELECT status, COUNT(*) as count FROM applications GROUP BY status`);
    const total = await query<{ count: string }>(`SELECT COUNT(*) as count FROM applications`);
    const thisMonth = await query<{ count: string }>(`SELECT COUNT(*) as count FROM applications WHERE created_at >= date_trunc('month', NOW())`);
    const stats: Record<string, number> = { total: parseInt(total[0]?.count ?? '0'), this_month: parseInt(thisMonth[0]?.count ?? '0') };
    rows.forEach((r) => { stats[r.status] = parseInt(r.count); });
    res.json(stats);
  } catch (err) { console.error('Stats error:', err); res.status(500).json({ error: 'Failed to fetch stats' }); }
});

applicationsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await queryOne<Application>(`SELECT * FROM applications WHERE id = $1`, [req.params.id]);
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    app.photo_urls = app.photo_keys.map((k) => getFileUrl(k));
    const logs = await query(`SELECT al.*, a.name as admin_name FROM activity_log al LEFT JOIN admins a ON al.admin_id = a.id WHERE al.application_id = $1 ORDER BY al.created_at DESC`, [req.params.id]);
    res.json({ ...app, activity_log: logs });
  } catch (err) { console.error('Get error:', err); res.status(500).json({ error: 'Failed to fetch application' }); }
});

applicationsRouter.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: 'Validation failed' }); return; }
    const { status, admin_notes, notify_model } = parsed.data;
    const app = await queryOne<Application>(`UPDATE applications SET status=$1, admin_notes=COALESCE($2, admin_notes), reviewed_by=$3, reviewed_at=NOW() WHERE id=$4 RETURNING *`, [status, admin_notes ?? null, req.admin!.adminId, req.params.id]);
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    await query(`INSERT INTO activity_log (application_id,admin_id,action,metadata) VALUES ($1,$2,$3,$4)`, [app.id, req.admin!.adminId, 'status_changed', { to: status, notes: admin_notes }]);
    if (notify_model) sendStatusUpdateEmail(app, status, admin_notes).catch(console.error);
    res.json({ message: 'Status updated', application: app });
  } catch (err) { console.error('Status update error:', err); res.status(500).json({ error: 'Failed to update status' }); }
});

applicationsRouter.post('/:id/send-agreement', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await queryOne<Application>(`SELECT * FROM applications WHERE id = $1`, [req.params.id]);
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    const pdfBuffer = await generateAgreementPDF(app);
    const filename = `${app.id}_agreement.pdf`;
    const { key } = await uploadPDF(pdfBuffer, filename);
    await query(`UPDATE applications SET agreement_sent=true, agreement_sent_at=NOW(), agreement_pdf_key=$1 WHERE id=$2`, [key, app.id]);
    await sendAgreementEmail(app, pdfBuffer);
    await query(`INSERT INTO activity_log (application_id,admin_id,action) VALUES ($1,$2,$3)`, [app.id, req.admin!.adminId, 'agreement_sent']);
    res.json({ message: 'Agreement sent successfully' });
  } catch (err) { console.error('Agreement error:', err); res.status(500).json({ error: 'Failed to send agreement' }); }
});

applicationsRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await queryOne<Application>(`DELETE FROM applications WHERE id=$1 RETURNING *`, [req.params.id]);
    if (!app) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Application deleted' });
  } catch (err) { console.error('Delete error:', err); res.status(500).json({ error: 'Failed to delete' }); }
});

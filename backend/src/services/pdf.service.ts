import PDFDocument from 'pdfkit';
import { Application } from '../types';

export async function generateAgreementPDF(app: Application): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 72 });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const GOLD = '#C8963E';
    const DARK = '#1A1A1A';
    const GRAY = '#888888';
    const LIGHT = '#F5F0E8';
    const W = 612 - 144; // page width minus margins

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(0, 0, 612, 8).fill(GOLD);

    // ── Company name ─────────────────────────────────────────────────────────
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(22).fillColor(DARK).text('IBH COMPANY', { align: 'center' });
    doc.font('Helvetica').fontSize(13).fillColor(GOLD).text('MODEL UPFRONT AGREEMENT', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(GRAY).text(`Effective Date: ${today}`, { align: 'center' });

    // Gold divider
    doc.moveDown(0.8);
    doc.moveTo(72, doc.y).lineTo(540, doc.y).strokeColor(GOLD).lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Preamble ─────────────────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(10).fillColor('#333333').text(
      `This Upfront Agreement ("Agreement") is entered into between IBH Company ("the Company") and the individual identified below ("the Model") prior to the execution of any formal modeling contract. By proceeding, the Model acknowledges that they have read, understood, and agree to the contents of this Agreement.`,
      { lineGap: 4, align: 'justify' }
    );
    doc.moveDown(1);

    // ── Helper: section title ──────────────────────────────────────────────
    const sectionTitle = (num: string, title: string) => {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(`${num}.  ${title}`);
      doc.moveTo(72, doc.y + 3).lineTo(540, doc.y + 3).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
      doc.moveDown(0.6);
    };

    const bullet = (text: string) => {
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(`•  ${text}`, {
        indent: 12, lineGap: 3,
      });
    };

    const bodyText = (text: string) => {
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(text, { lineGap: 4, align: 'justify' });
    };

    // ── Section 1: Model Information ─────────────────────────────────────────
    sectionTitle('1', 'Model Information');

    // Info table
    const fields: [string, string][] = [
      ['Full Legal Name', `${app.first_name} ${app.last_name}`],
      ['Date of Birth', new Date(app.date_of_birth).toLocaleDateString('en-US', { dateStyle: 'long' })],
      ['Location', app.location],
      ['Email', app.email],
      ['Phone', app.phone],
      ['Instagram', app.instagram || '—'],
    ];

    fields.forEach(([label, value]) => {
      const y = doc.y;
      doc.rect(72, y, 150, 22).fill(LIGHT);
      doc.rect(226, y, W - 154, 22).fill('#FFFFFF').stroke('#EEEEEE');
      doc.font('Helvetica-Bold').fontSize(9).fillColor(GRAY).text(label, 78, y + 7);
      doc.font('Helvetica').fontSize(9).fillColor(DARK).text(value, 232, y + 7);
      doc.y = y + 24;
    });

    doc.moveDown(1);

    // ── Section 2: Nature of Work ─────────────────────────────────────────────
    sectionTitle('2', 'Nature of Work');
    bodyText('As a model with IBH Company, the Model may be required to participate in assignments including:');
    doc.moveDown(0.4);
    [
      'Fashion & Runway — fashion shows, runway presentations, fittings, and designer showcases',
      'Commercial & Print — photoshoots, advertising campaigns, editorial, and e-commerce content',
      'Fitness & Lifestyle — wellness, activewear, and lifestyle brand campaigns and activations',
    ].forEach(bullet);

    // ── Section 3: Model Responsibilities ────────────────────────────────────
    sectionTitle('3', 'Model Responsibilities');
    [
      'Maintain professionalism at all times on set, at events, and when representing the Company',
      'Arrive punctually and prepared for all scheduled assignments, fittings, and meetings',
      'Follow direction from photographers, directors, stylists, and production personnel',
      'Keep all client information, campaign details, and unreleased content strictly confidential',
      'Notify the Company immediately if unable to fulfill a scheduled booking',
    ].forEach(bullet);

    // ── Section 4: Company Responsibilities ──────────────────────────────────
    sectionTitle('4', 'Company Responsibilities');
    [
      'Provide the Model with clear and timely briefings for all assignments',
      'Treat the Model with dignity and respect in all professional interactions',
      'Ensure safe and appropriate working conditions on all productions',
      'Process all agreed-upon payments promptly and in accordance with the formal contract',
    ].forEach(bullet);

    // ── Section 5: Image & Likeness ───────────────────────────────────────────
    sectionTitle('5', 'Image & Likeness');
    bodyText(
      'IBH Company, its clients, and authorized partners may photograph, film, or record the Model\'s image and likeness in connection with assignments. The scope of usage rights will be specified in the formal modeling contract for each booking. The Model will not be required to consent to any usage beyond what is agreed upon in writing.'
    );

    // ── Section 6: Exclusivity ────────────────────────────────────────────────
    sectionTitle('6', 'Exclusivity & Other Engagements');
    bodyText(
      'Unless otherwise agreed in writing, this Upfront Agreement is non-exclusive. The Model may continue to work with other agencies and clients but must disclose any existing exclusive agreements and avoid conflicts of interest with active IBH campaigns.'
    );

    // ── Section 7: Conduct ────────────────────────────────────────────────────
    sectionTitle('7', 'Professional Conduct');
    bodyText(
      'The Model agrees to uphold IBH Company\'s code of conduct at all times. Breach of conduct standards may result in immediate termination of the engagement. The Model agrees not to engage in discriminatory, abusive, or harassing behavior, or share confidential information publicly.'
    );

    // ── Section 8: Acknowledgement ────────────────────────────────────────────
    sectionTitle('8', 'Acknowledgement');
    bodyText(
      'By signing below, both parties confirm that they have read and understood this Upfront Agreement and agree to act in good faith. This Agreement does not replace the formal modeling contract but serves as a preliminary understanding ahead of formal engagement.'
    );

    // ── Signature block ───────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.moveTo(72, doc.y).lineTo(540, doc.y).strokeColor(GOLD).lineWidth(0.5).stroke();
    doc.moveDown(1.5);

    // Two columns
    const sigY = doc.y;
    // Left — model
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text('MODEL', 72, sigY);
    doc.moveTo(72, sigY + 50).lineTo(280, sigY + 50).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('Signature', 72, sigY + 54);
    doc.moveTo(72, sigY + 90).lineTo(280, sigY + 90).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.text('Printed Name', 72, sigY + 94);
    doc.font('Helvetica').fontSize(9).fillColor(DARK).text(`${app.first_name} ${app.last_name}`, 72, sigY + 92);
    doc.moveTo(72, sigY + 130).lineTo(280, sigY + 130).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('Date', 72, sigY + 134);

    // Right — IBH
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text('IBH COMPANY REPRESENTATIVE', 332, sigY);
    doc.moveTo(332, sigY + 50).lineTo(540, sigY + 50).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('Signature', 332, sigY + 54);
    doc.moveTo(332, sigY + 90).lineTo(540, sigY + 90).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.text('Printed Name & Title', 332, sigY + 94);
    doc.moveTo(332, sigY + 130).lineTo(540, sigY + 130).strokeColor(DARK).lineWidth(0.75).stroke();
    doc.text('Date', 332, sigY + 134);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(0, 756, 612, 8).fill(GOLD);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text(
      'Confidential  •  IBH Company  •  This document is intended solely for the named parties.',
      0, 740, { align: 'center', width: 612 }
    );

    doc.end();
  });
}

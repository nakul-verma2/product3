const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Streams to disk (never buffers the whole PDF in memory).
function generateAuditPdf({ destPath, userEmail, period, stats, breakdown, incidents }) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const doc = new PDFDocument({ margin: 48 });
    const stream = fs.createWriteStream(destPath);
    doc.pipe(stream);

    doc.fontSize(18).text('Uptime Audit Report', { underline: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#555').text(`Account: ${userEmail}   Period: ${period}   Generated: ${new Date().toISOString()}`);
    doc.moveDown(0.8).fillColor('#000');

    doc.fontSize(12).text(`Overall uptime: ${stats.uptimePercent.toFixed(2)}%`);
    doc.text(`Total checks: ${stats.totalChecks}   Up: ${stats.upChecks}`);
    doc.text(`Incidents: ${stats.incidents}   MTTR: ${stats.mttrMinutes} min`);
    doc.moveDown(0.8);

    doc.fontSize(13).text('Per-site breakdown');
    doc.moveDown(0.3);
    breakdown.slice(0, 100).forEach((b) => {
      doc.fontSize(10).text(`${b.name} — ${b.url} — ${b.uptimePercent.toFixed(2)}% (${b.up}/${b.total}) avg ${b.avgMs ?? '—'} ms`);
    });
    doc.moveDown(0.8);

    doc.fontSize(13).text('Incidents');
    doc.moveDown(0.3);
    if (!incidents.length) doc.fontSize(10).text('No incidents in period.');
    incidents.slice(0, 200).forEach((i) => {
      doc.fontSize(10).text(`${i.status} — ${i.targetName || i.websiteId} — ${i.startedAt?.toISOString?.() || i.startedAt} — ${i.rootCause || ''} ${i.durationMinutes ?? ''}`);
    });

    doc.end();
    stream.on('finish', () => resolve(destPath));
    stream.on('error', reject);
  });
}

module.exports = { generateAuditPdf };

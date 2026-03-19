const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// --- Sample data ---
const users = [
  { id: 1, name: 'Alice Johnson',  email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith',      email: 'bob@example.com' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com' },
];

const donations = [
  { userId: 1, date: '2024-01-15', amount: 50,  method: 'cash', note: 'Spring fundraiser' },
  { userId: 1, date: '2024-04-22', amount: 100, method: 'cash', note: 'Annual gala' },
  { userId: 1, date: '2024-11-10', amount: 75,  method: 'cash', note: 'Holiday drive' },
  { userId: 2, date: '2024-03-05', amount: 200, method: 'cash', note: 'Building fund' },
  { userId: 2, date: '2024-09-18', amount: 150, method: 'cash', note: 'General' },
  { userId: 3, date: '2023-06-01', amount: 300, method: 'cash', note: 'Capital campaign' },
  { userId: 3, date: '2024-12-01', amount: 500, method: 'cash', note: 'Year-end gift' },
];

// GET /api/users - list all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// GET /api/donations/summary?userId=1&year=2024
app.get('/api/donations/summary', (req, res) => {
  const { userId, year } = req.query;
  if (!userId || !year) {
    return res.status(400).json({ error: 'userId and year are required' });
  }

  const uid = parseInt(userId, 10);
  const y   = parseInt(year, 10);
  const user = users.find(u => u.id === uid);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const rows = donations.filter(d => {
    return d.userId === uid && new Date(d.date).getFullYear() === y;
  });

  const total = rows.reduce((sum, d) => sum + d.amount, 0);

  res.json({ user, year: y, donations: rows, total });
});

// POST /api/send-donation-email
// Body: { userId, year, senderEmail, senderPassword, smtpHost, smtpPort }
app.post('/api/send-donation-email', async (req, res) => {
  const { userId, year, senderEmail, senderPassword, smtpHost, smtpPort } = req.body;

  if (!userId || !year) {
    return res.status(400).json({ error: 'userId and year are required' });
  }

  const uid = parseInt(userId, 10);
  const y   = parseInt(year, 10);
  const user = users.find(u => u.id === uid);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const rows = donations.filter(d => {
    return d.userId === uid && new Date(d.date).getFullYear() === y;
  });

  const total = rows.reduce((sum, d) => sum + d.amount, 0);

  // Build email body
  const donationLines = rows.length
    ? rows.map(d =>
        `  • ${d.date}  $${d.amount.toFixed(2)}  (${d.note || 'Cash donation'})`
      ).join('\n')
    : '  No cash donations recorded for this year.';

  const text = `
Dear ${user.name},

Thank you for your generous cash donations in ${y}!

Donation Summary – ${y}
──────────────────────────────────
${donationLines}
──────────────────────────────────
Total:  $${total.toFixed(2)}

Your contributions make a real difference. We are grateful for your continued support.

Warm regards,
Your Organization
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#222;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#4a90d9">Donation Summary for ${y}</h2>
  <p>Dear <strong>${user.name}</strong>,</p>
  <p>Thank you for your generous cash donations in ${y}!</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <thead>
      <tr style="background:#f0f4ff">
        <th style="text-align:left;padding:8px;border:1px solid #d0d7e0">Date</th>
        <th style="text-align:right;padding:8px;border:1px solid #d0d7e0">Amount</th>
        <th style="text-align:left;padding:8px;border:1px solid #d0d7e0">Note</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length
        ? rows.map(d => `
          <tr>
            <td style="padding:8px;border:1px solid #d0d7e0">${d.date}</td>
            <td style="padding:8px;border:1px solid #d0d7e0;text-align:right">$${d.amount.toFixed(2)}</td>
            <td style="padding:8px;border:1px solid #d0d7e0">${d.note || '—'}</td>
          </tr>`).join('')
        : `<tr><td colspan="3" style="padding:8px;text-align:center;color:#888">No cash donations recorded for ${y}</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr style="background:#f0f4ff;font-weight:bold">
        <td style="padding:8px;border:1px solid #d0d7e0">Total</td>
        <td style="padding:8px;border:1px solid #d0d7e0;text-align:right">$${total.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #d0d7e0"></td>
      </tr>
    </tfoot>
  </table>
  <p>Your contributions make a real difference. We are grateful for your continued support.</p>
  <p>Warm regards,<br/><strong>Your Organization</strong></p>
</body>
</html>
`.trim();

  try {
    // Use provided SMTP settings or fall back to Ethereal (test account)
    let transporter;
    if (senderEmail && senderPassword) {
      transporter = nodemailer.createTransport({
        host: smtpHost || 'smtp.gmail.com',
        port: smtpPort || 587,
        secure: false,
        auth: { user: senderEmail, pass: senderPassword },
      });
    } else {
      // Create a disposable Ethereal test account for preview
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const info = await transporter.sendMail({
      from: senderEmail || '"Donation System" <no-reply@example.com>',
      to: user.email,
      subject: `Your ${y} Cash Donation Summary`,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    res.json({
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

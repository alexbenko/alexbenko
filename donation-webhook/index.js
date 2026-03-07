const express = require('express');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ORG_NAME = 'Neighborhood Harvest';
const ORG_ADDRESS = 'PO BOX 631, Willow Creek, CA 95573';
const ORG_WEBSITE = 'http://neighborhood-harvest.org';

const app = express();

// Use raw body for Stripe signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status === 'paid') {
      await sendDonationEmail(session);
    }
  }

  res.json({ received: true });
});

async function sendDonationEmail(session) {
  const customerDetails = session.customer_details || {};

  // name and email are required
  const name = customerDetails.name;
  const email = customerDetails.email;

  if (!name || !email) {
    console.error('Missing required donor fields: name and email are required', { name, email });
    return;
  }

  const amountDollars = (session.amount_total / 100).toFixed(2);

  // Optional fields from customer_details
  const phone = customerDetails.phone || null;
  const address = customerDetails.address || {};
  const city = address.city || null;
  const state = address.state || null;
  const postalCode = address.postal_code || null;
  const country = address.country || null;

  const addressParts = [city, state, postalCode, country].filter(Boolean);
  const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null;

  // Build optional info section
  const optionalLines = [];
  if (phone) optionalLines.push(`Phone: ${phone}`);
  if (addressLine) optionalLines.push(`Location: ${addressLine}`);

  const optionalSection = optionalLines.length > 0
    ? `\n\nAdditional donor info:\n${optionalLines.join('\n')}`
    : '';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: `New Donation Received - $${amountDollars} from ${name}`,
    text: [
      `A new donation has been received!`,
      ``,
      `Donor Information:`,
      `  Name:  ${name}`,
      `  Email: ${email}`,
      `  Amount: $${amountDollars} USD`,
      optionalSection,
      ``,
      `Payment ID: ${session.payment_intent}`,
      `Session ID: ${session.id}`,
      ``,
      `--`,
      `${ORG_NAME}`,
      `${ORG_ADDRESS}`,
      `${ORG_WEBSITE}`,
    ].join('\n'),
    html: `
      <h2>New Donation Received!</h2>
      <h3>Donor Information</h3>
      <table>
        <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Amount</strong></td><td>$${amountDollars} USD</td></tr>
        ${phone ? `<tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>` : ''}
        ${addressLine ? `<tr><td><strong>Location</strong></td><td>${escapeHtml(addressLine)}</td></tr>` : ''}
      </table>
      <p style="color: #888; font-size: 12px;">
        Payment ID: ${session.payment_intent}<br>
        Session ID: ${session.id}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
      <p style="color: #888; font-size: 12px; text-align: center;">
        ${escapeHtml(ORG_NAME)}<br>
        ${escapeHtml(ORG_ADDRESS)}<br>
        <a href="${ORG_WEBSITE}" style="color: #888;">${ORG_WEBSITE}</a>
      </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Donation email sent for ${name} (${email}) - $${amountDollars}`);
  } catch (err) {
    console.error('Failed to send donation email:', err);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Donation webhook server running on port ${PORT}`);
});

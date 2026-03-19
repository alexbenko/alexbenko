# Donation Email Feature

Send year-end cash donation summary emails to donors via a simple dialog UI.

## Features

- Dialog with a **donor selector** (email shown) and a **year selector**
- Live preview of donation totals for the selected donor + year
- One-click send — generates an HTML + plain-text email
- Falls back to [Ethereal](https://ethereal.email/) test accounts so you can preview emails without real SMTP credentials

## Project Structure

```
donation-email-feature/
├── index.html
├── package.json
├── vite.config.js
├── server/
│   └── index.js        # Express API (port 3001)
└── src/
    ├── main.jsx
    ├── App.jsx / App.css
    └── components/
        ├── DonationEmailDialog.jsx
        └── DonationEmailDialog.css
```

## Getting Started

```bash
cd donation-email-feature
npm install
npm run dev           # starts both Vite (port 5173) and Express (port 3001)
```

Open http://localhost:5173, click **Send Donation Email**, pick a donor and year, then hit **Send Email**.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all donors |
| GET | `/api/donations/summary?userId=&year=` | Donation totals for a donor/year |
| POST | `/api/send-donation-email` | Send the summary email |

### POST body (all optional except `userId` + `year`)

```json
{
  "userId": 1,
  "year": 2024,
  "senderEmail": "you@gmail.com",
  "senderPassword": "app-password",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587
}
```

If `senderEmail`/`senderPassword` are omitted, a disposable Ethereal test account is used and a `previewUrl` is returned in the response.

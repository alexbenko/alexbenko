# Neighborhood Harvest

## Organization Info

- **Name:** Neighborhood Harvest
- **Address:** PO BOX 631, Willow Creek, CA 95573
- **Website:** http://neighborhood-harvest.org
- **Donations page:** http://neighborhood-harvest.org/donate/success

## Stack

- **Backend:** Django (Python) + Django REST Framework
- **Frontend:** Angular + Angular Material
- **Database:** PostgreSQL
- **Cache:** Redis
- **Payments:** Stripe (webhook handler in `donation-webhook/`)

## Donation Webhook

Located in `donation-webhook/`. Handles Stripe `checkout.session.completed` events.
- Requires `customer_details.name` and `customer_details.email` (both mandatory)
- Sends notification email with all available donor info and org address footer
- Configure via `.env` (see `donation-webhook/.env.example`)

## Site Components

Angular components for the public-facing site are in `frontend/src/app/`.
Key areas where the org address should appear:
- `footer` component — displayed on every page
- `donate` page — alongside the Stripe payment link
- `contact` page — primary location for mailing address

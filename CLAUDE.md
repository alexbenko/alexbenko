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

## PWA Policy

**Only Harvest Hub should be a PWA.** The public site at neighborhood-harvest.org
must load normally in any browser without service worker or PWA requirements.

- `frontend/` — the **public-facing Angular app** at neighborhood-harvest.org.
  **No service worker.** `app.config.ts` must NOT include `provideServiceWorker`.
- Harvest Hub — the separate management app. PWA is appropriate there.

If you ever add Angular's `@angular/pwa` or `ServiceWorkerModule`/`provideServiceWorker`
to `frontend/`, revert it. The public site breaking is a severe user-facing issue.

### Kill-switch

`frontend/src/ngsw-worker.js` is a kill-switch service worker. It must be
deployed at `/ngsw-worker.js` so that browsers which previously installed the
Angular PWA worker (from an earlier mis-configuration) will automatically
unregister it and reload the page normally. Do not remove this file.

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

## Autocomplete Dropdowns

All select/dropdown fields in the app use Angular Material `mat-autocomplete`
instead of `mat-select`. This lets users type to filter long lists while also
seeing the **full list on first focus** — important for new users who don't
know what options are available.

### Pattern (required for every autocomplete field)

```typescript
// In the component class
filteredOptions$!: Observable<string[]>;
const ALL_OPTIONS = ['Option A', 'Option B', ...];

ngOnInit() {
  this.filteredOptions$ = this.ctrl.valueChanges.pipe(
    startWith(''),          // <-- emits '' immediately so the list pre-populates
    map(v => this._filter(v ?? '', ALL_OPTIONS))
  );
}

private _filter(value: string, options: string[]): string[] {
  if (!value.trim()) return options;  // show ALL when the field is empty
  const lower = value.toLowerCase();
  return options.filter(o => o.toLowerCase().includes(lower));
}
```

```html
<!-- In the template -->
<input matInput [formControl]="ctrl" [matAutocomplete]="auto"
       placeholder="Select or type to search…">
<mat-autocomplete #auto="matAutocomplete" autoActiveFirstOption>
  <mat-option *ngFor="let opt of filteredOptions$ | async" [value]="opt">
    {{ opt }}
  </mat-option>
</mat-autocomplete>
<mat-hint>Click to see all options or start typing to filter</mat-hint>
```

### Admin Components Using This Pattern

- `pages/cash-donations` — records in-person cash/check donations received by staff

## Photo Album Social Media Preview

Each album has an optional `social_preview_photo` that is used as the `og:image`
when the album link is shared on social media.

### Behaviour

- **Default**: if `social_preview_photo` is `null` the backend (and the Angular
  component) automatically fall back to the **first photo** in the album
  (ordered by `position` then `id`).
- **Explicit**: admins can pick any photo in the album via the config page.
  The selection is saved as `social_preview_photo_id` on the `Album` model.

### API

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET`  | `/api/albums/{id}/` | — | Returns album + all photos + `social_preview_url` |
| `PATCH`| `/api/albums/{id}/social-preview/` | `{ "social_preview_photo_id": <int\|null> }` | Updates the preview selection |

Pass `null` to reset to the default (first photo).

### Angular Component

`pages/albums/album-config` — displays a responsive photo grid where each photo
acts as a selectable card. Key points:

- Clicking a photo stages it as the new preview (highlighted with a blue border
  and a check-circle overlay).
- The first photo shows a "Default" chip when nothing is explicitly saved.
- The selected photo shows a "Preview" chip.
- A sticky **Save preview selection** button only becomes active when the staged
  selection differs from what is saved on the server (`isDirty` guard).
- The component loads the album via `GET /api/albums/{id}/` and initialises the
  selection from `social_preview_photo_id` (falling back to the first photo's id
  so the UI always has a sensible default shown).

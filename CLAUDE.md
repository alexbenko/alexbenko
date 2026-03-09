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

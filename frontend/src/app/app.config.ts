import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    // provideServiceWorker intentionally omitted.
    // PWA / service worker support belongs on Harvest Hub, not this public site.
    // The public site at neighborhood-harvest.org must be accessible in any browser
    // without requiring installation or service worker support.
  ],
};

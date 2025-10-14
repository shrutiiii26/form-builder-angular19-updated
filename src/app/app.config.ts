import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app-routing.module';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { formsReducer } from './state/forms/forms.reducer';
import { FormsEffects } from './state/forms/forms.effects';
import { provideServiceWorker } from '@angular/service-worker';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore({ forms: formsReducer }),
    provideEffects([FormsEffects]),
    provideServiceWorker('ngsw-worker.js', { enabled: true })
  ]
};




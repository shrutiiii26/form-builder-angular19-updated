import { Injectable } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storageKey = 'theme-preference';

  init(): void {
    const pref = (localStorage.getItem(this.storageKey) as ThemePreference) || 'system';
    this.apply(pref);
  }

  get(): ThemePreference {
    return (localStorage.getItem(this.storageKey) as ThemePreference) || 'system';
  }

  set(pref: ThemePreference): void {
    localStorage.setItem(this.storageKey, pref);
    this.apply(pref);
  }

  private apply(pref: ThemePreference): void {
    const root = document.documentElement;
    let theme: 'light' | 'dark' = 'light';

    if (pref === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      theme = mql.matches ? 'dark' : 'light';
      // respond to future system changes
      mql.onchange = (e) => {
        if (this.get() === 'system') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
    } else {
      theme = pref;
    }

    root.setAttribute('data-theme', theme);
  }
}



import { Injectable, signal, effect, EffectRef, inject } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.resolveInitialTheme());

  private readonly _effectRef: EffectRef | null = null;

  constructor() {
    this._effectRef = effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private resolveInitialTheme(): Theme {
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark';
  }
}

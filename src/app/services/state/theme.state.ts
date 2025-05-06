import { Injectable, signal } from '@angular/core';

export const allThemes = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
] as const;

export type ThemType = (typeof allThemes)[number];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private theme = signal<ThemType>((localStorage.getItem('theme') as ThemType) ?? 'light');

  constructor() {
    this.setTheme(this.theme());
  }

  public setTheme(theme: ThemType) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}

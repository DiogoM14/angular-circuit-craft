import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroClipboardDocumentCheck,
  heroClock,
  heroGlobeAlt,
  heroMagnifyingGlass,
  heroMoon,
  heroRectangleGroup,
  heroSun,
  heroUserGroup,
} from '@ng-icons/heroicons/outline';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'cc-side-nav',
  templateUrl: './side-nav.component.html',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      heroMagnifyingGlass,
      heroUserGroup,
      heroClipboardDocumentCheck,
      heroRectangleGroup,
      heroGlobeAlt,
      heroClock,
      heroSun,
      heroMoon,
    }),
  ],
})
export class SideNavComponent {
  public themService = inject(ThemeService);

  //public sideNavItems: SideNavItem[] = SideNavItemsConfig;

  public handleDrag(event: DragEvent | null) {
    if (!event?.dataTransfer || !event.target) return;
    const target = event.target as HTMLElement;
    event.dataTransfer.setData('node', target.getAttribute('data-node') || '');
  }

  public toggleTheme(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) {
      const theme = target.checked ? 'light' : 'dracula';
      this.themService.setTheme(theme);
    }
  }
}

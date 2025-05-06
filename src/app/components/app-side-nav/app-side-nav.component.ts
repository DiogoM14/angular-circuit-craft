import {Component, inject} from '@angular/core';
import {SideNavItem} from './types/side-nav-items.type';
import {SideNavItemsConfig} from './config/side-nav-items.config';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {
  heroClipboardDocumentCheck,
  heroClock,
  heroGlobeAlt,
  heroMagnifyingGlass,
  heroMoon,
  heroRectangleGroup,
  heroSun,
  heroUserGroup
} from '@ng-icons/heroicons/outline';
import {allThemes, ThemeService} from '../../services/state/theme.state';

@Component({
  selector: 'app-side-nav',
  templateUrl: './app-side-nav.component.html',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({
    heroMagnifyingGlass,
    heroUserGroup,
    heroClipboardDocumentCheck,
    heroRectangleGroup,
    heroGlobeAlt,
    heroClock,
    heroSun,
    heroMoon
  })]
})
export class AppSideNavComponent {
  public sideNavItems: SideNavItem[] = SideNavItemsConfig;

  public themService = inject(ThemeService);

  themes = allThemes;

  toggleTheme(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) {
      const theme = target.checked ? 'light' : 'dracula';
      this.themService.setTheme(theme);
    }
  }
}

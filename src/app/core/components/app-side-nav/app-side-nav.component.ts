import { Component, inject } from '@angular/core';
import { SideNavItem } from './types/side-nav-items.type';
import { SideNavItemsConfig } from './config/side-nav-items.config';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowPathRoundedSquare,
  heroArrowsRightLeft,
  heroBeaker,
  heroClipboardDocumentCheck,
  heroClock,
  heroGlobeAlt,
  heroMagnifyingGlass,
  heroMoon,
  heroPuzzlePiece,
  heroRectangleGroup,
  heroSun,
  heroUserGroup,
} from '@ng-icons/heroicons/outline';
import { ThemeService } from '../../services/state/theme.state';

@Component({
  selector: 'app-side-nav',
  templateUrl: './app-side-nav.component.html',
  standalone: true,
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
      heroArrowPathRoundedSquare,
      heroArrowsRightLeft,
      heroPuzzlePiece,
      heroBeaker,
      //heroCubeTransparent
    }),
  ],
})
export class AppSideNavComponent {
  public themService = inject(ThemeService);
  public sideNavItems: SideNavItem[] = SideNavItemsConfig;

  listNodes = [
    {
      name: 'Get/Post',
      color: '#49494970',
      item: 'Node1',
      input: 0,
      output: 1,
    },
    {
      name: 'Script',
      color: 'blue',
      item: 'Node2',
      input: 1,
      output: 2,
    },
    {
      name: 'console.log',
      color: '#ff9900',
      item: 'Node3',
      input: 1,
      output: 0,
    },
  ];

  public toggleTheme(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) {
      const theme = target.checked ? 'light' : 'dracula';
      this.themService.setTheme(theme);
    }
  }

  public handleDragStart(event: any) {
    if (event.type === 'touchstart') {
      //mobile_item_selec = event.target.closest('.drag-drawflow').getAttribute('data-node');
    } else {
      console.log('dragstart', event);
      event.dataTransfer.setData('node', event.target.getAttribute('data-node'));
    }
  }
}

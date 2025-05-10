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
import { DrawflowService } from '../../services/drawflow.service';

@Component({
  selector: 'cc-side-nav',
  templateUrl: './side-nav.component.html',
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
    }),
  ],
})
export class SideNavComponent {
  public themService = inject(ThemeService);
  private drawflowService = inject(DrawflowService);

  //public sideNavItems: SideNavItem[] = SideNavItemsConfig;
  private nodeCount = 0;

  public addNode() {
    this.nodeCount++;
    const data = {
      title: `Node ${this.nodeCount}`,
      value: `Value ${this.nodeCount}`,
    };

    this.drawflowService.addWebComponentNode('web-component-node', 1, 1, 100, 100 + this.nodeCount * 50, data);
  }

  public toggleTheme(target: EventTarget | null) {
    if (target instanceof HTMLInputElement) {
      const theme = target.checked ? 'light' : 'dracula';
      this.themService.setTheme(theme);
    }
  }
}

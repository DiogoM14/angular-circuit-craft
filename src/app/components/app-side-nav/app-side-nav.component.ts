import { Component } from '@angular/core';
import { SideNavItem } from './types/side-nav-items.type';
import { SideNavItemsConfig } from './config/side-nav-items.config';

@Component({
  selector: 'app-side-nav',
  templateUrl: './app-side-nav.component.html',
})
export class AppSideNavComponent {
  public sideNavItems: SideNavItem[] = SideNavItemsConfig;
}

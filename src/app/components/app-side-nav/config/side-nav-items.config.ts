import { ROUTES } from '../../../consts/routes.consts';
import { SideNavItem } from '../types/side-nav-items.type';

export const SideNavItemsConfig: SideNavItem[] = [
  { icon: 'space_dashboard', label: 'Dashboard', route: ROUTES.DASHBOARD },
  { icon: 'devices_other', label: 'Devices', route: '/help' },
  { icon: 'memory', label: 'Modules', route: '/help' },
  { icon: 'group', label: 'User', route: '/help' },
];

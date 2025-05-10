import { ApplicationConfig, Injector, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';
import { NodeContentComponent } from './components/node-content/node-content.component';

export function initializeWebComponents(injector: Injector) {
  const NodeContentElement = createCustomElement(NodeContentComponent, {
    injector,
  });
  customElements.define('node-content-element', NodeContentElement);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: 'INITIALIZE_WEB_COMPONENTS',
      useFactory: initializeWebComponents,
      deps: [Injector],
      multi: true,
    },
  ],
};

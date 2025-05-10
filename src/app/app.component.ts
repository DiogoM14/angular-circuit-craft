import { Component, Inject, Optional } from '@angular/core';
import {AppHeaderComponent} from './components/app-header/app-header.component';
import {AppSideNavComponent} from './components/app-side-nav/app-side-nav.component';
import { DrawflowEditorComponent } from './components/drawflow-editor/drawflow-editor.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [AppHeaderComponent, AppSideNavComponent, DrawflowEditorComponent],
  standalone: true
})
export class AppComponent {
  constructor(@Optional() @Inject('INITIALIZE_WEB_COMPONENTS') init: any) {
    // This will trigger the initialization of web components
  }
}

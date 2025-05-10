import { Component, Inject, Optional } from '@angular/core';
import { WorkflowComponent } from './pages/workflow/workflow.component';

@Component({
  selector: 'cc-root',
  templateUrl: './app.component.html',
  imports: [WorkflowComponent],
  standalone: true,
})
export class AppComponent {
  constructor(@Optional() @Inject('INITIALIZE_WEB_COMPONENTS') init: any) {
    // This will trigger the initialization of web components
  }
}

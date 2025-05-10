import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SideNavComponent } from '../../components/side-nav/side-nav.component';
import { DrawflowEditorComponent } from '../../components/drawflow-editor/drawflow-editor.component';

@Component({
  selector: 'cc-workflow',
  imports: [HeaderComponent, SideNavComponent, DrawflowEditorComponent],
  templateUrl: './workflow.component.html',
  standalone: true,
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent {}

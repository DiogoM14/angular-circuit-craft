import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() workflowName = 'New Workflow';
  @Input() workflowStatus = 'Ready';
  @Input() currentZoom = 100;
  @Input() nodeCount = 0;
  @Input() connectionCount = 0;

  @Output() workflowNameChange = new EventEmitter<string>();
  @Output() executeWorkflow = new EventEmitter<void>();
  @Output() clearWorkflow = new EventEmitter<void>();
  @Output() saveWorkflow = new EventEmitter<void>();
  @Output() openLoadDialog = new EventEmitter<void>();
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();

  onWorkflowNameChange(name: string) {
    this.workflowNameChange.emit(name);
  }

  onExecuteWorkflow() {
    this.executeWorkflow.emit();
  }

  onClearWorkflow() {
    this.clearWorkflow.emit();
  }

  onSaveWorkflow() {
    this.saveWorkflow.emit();
  }

  onOpenLoadDialog() {
    this.openLoadDialog.emit();
  }

  onZoomIn() {
    this.zoomIn.emit();
  }

  onZoomOut() {
    this.zoomOut.emit();
  }

  onResetZoom() {
    this.resetZoom.emit();
  }
}

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
  @Input() workflowName!: string;
  @Input() workflowStatus!: string;
  
  @Output() workflowNameChange = new EventEmitter<string>();
  @Output() saveWorkflow = new EventEmitter<void>();
  @Output() openLoadDialog = new EventEmitter<void>();
  @Output() exportWithHistory = new EventEmitter<void>();
  @Output() newWorkflow = new EventEmitter<void>();

  onWorkflowNameChange(name: string): void {
    this.workflowNameChange.emit(name);
  }

  onSaveWorkflow(): void {
    this.saveWorkflow.emit();
  }

  onOpenLoadDialog(): void {
    this.openLoadDialog.emit();
  }

  onExportWithHistory(): void {
    this.exportWithHistory.emit();
  }

  onNewWorkflow(): void {
    this.newWorkflow.emit();
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-toolbar.component.html',
  styleUrl: './bottom-toolbar.component.scss'
})
export class BottomToolbarComponent {
  @Input() currentZoom = 100;
  @Input() nodeCount = 0;
  @Input() connectionCount = 0;

  @Output() executeWorkflow = new EventEmitter<void>();
  @Output() clearWorkflow = new EventEmitter<void>();
  @Output() openHistory = new EventEmitter<void>();
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();

  onExecuteWorkflow() {
    this.executeWorkflow.emit();
  }

  onClearWorkflow() {
    this.clearWorkflow.emit();
  }

  onOpenHistory() {
    this.openHistory.emit();
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
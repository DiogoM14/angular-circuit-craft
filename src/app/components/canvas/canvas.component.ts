import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NodeData {
  id: string;
  name: string;
  type: string;
  inputs: number;
  outputs: number;
  config: any;
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('drawflowContainer', { static: false }) drawflowContainer!: ElementRef;

  @Input() selectedNode: NodeData | null = null;
  @Input() nodeCount = 0;

  @Output() drop = new EventEmitter<DragEvent>();
  @Output() dragOver = new EventEmitter<DragEvent>();
  @Output() openConfigDialog = new EventEmitter<void>();
  @Output() drawflowContainerReady = new EventEmitter<ElementRef>();

  ngAfterViewInit() {
    if (this.drawflowContainer) {
      this.drawflowContainerReady.emit(this.drawflowContainer);
    }
  }

  onDrop(event: DragEvent) {
    this.drop.emit(event);
  }

  onDragOver(event: DragEvent) {
    this.dragOver.emit(event);
  }

  onOpenConfigDialog() {
    this.openConfigDialog.emit();
  }

  getNodeIcon(type: string | undefined): string {
    const icons: { [key: string]: string } = {
      'http-request': '🌐',
      'webhook': '🔗',
      'display-data': '📊',
      'transform': '🔄',
      'filter': '🔍',
      'if-condition': '🔀',
      'delay': '⏱️',
      'email': '📧',
      'slack': '💬',
      'database': '🗄️',
      'file-storage': '📁'
    };
    return icons[type || ''] || '📦';
  }
} 
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawflowService } from '../../services/drawflow.service';
import 'drawflow/dist/drawflow.min.css';

@Component({
  selector: 'cc-drawflow-editor',
  imports: [CommonModule],
  templateUrl: './drawflow-editor.component.html',
  styleUrl: './drawflow-editor.component.scss',
})
export class DrawflowEditorComponent implements OnInit {
  @ViewChild('drawflow', { static: true }) drawflowElement!: ElementRef;
  private drawflowService = inject(DrawflowService);

  ngOnInit() {
    this.drawflowService.initializeEditor(this.drawflowElement.nativeElement);
  }

  public handleDrop(event: DragEvent) {
    if (!event.dataTransfer) return;
    event.preventDefault();

    const data = event.dataTransfer.getData('node');
    this.addNode(data, event.clientX - 360, event.clientY - 120);
  }

  public handleAllowDrop(event: DragEvent) {
    event.preventDefault();
  }

  private addNode(data: string, x: number, y: number) {
    this.drawflowService.addWebComponentNode('web-component-node', 1, 1, x, y, data);
  }
}

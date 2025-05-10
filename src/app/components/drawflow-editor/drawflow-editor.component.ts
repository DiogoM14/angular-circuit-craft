import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawflowService } from '../../services/drawflow.service';
import 'drawflow/dist/drawflow.min.css';

@Component({
  selector: 'app-drawflow-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawflow-editor.component.html',
  styleUrl: './drawflow-editor.component.scss',
})
export class DrawflowEditorComponent implements OnInit {
  @ViewChild('drawflow', { static: true }) drawflowElement!: ElementRef;

  private drawflowService = inject(DrawflowService);
  private nodeCount = 0;

  ngOnInit() {
    this.drawflowService.initializeEditor(this.drawflowElement.nativeElement);
  }

  public addNode() {
    this.nodeCount++;
    const data = {
      title: `Node ${this.nodeCount}`,
      value: `Value ${this.nodeCount}`,
    };

    this.drawflowService.addWebComponentNode('web-component-node', 1, 1, 100, 100 + this.nodeCount * 50, data);
  }

  public exportFlow() {
    const exportData = this.drawflowService.exportFlow();
    localStorage.setItem('drawflow-data', JSON.stringify(exportData));
  }

  public importFlow() {
    const savedFlow = JSON.parse(localStorage.getItem('drawflow-data') || '{}');
    if (Object.keys(savedFlow).length > 0) {
      this.drawflowService.importFlow(savedFlow);
    }
  }
}

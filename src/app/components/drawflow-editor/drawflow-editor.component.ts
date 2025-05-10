import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawflowService } from '../../services/drawflow.service';
import 'drawflow/dist/drawflow.min.css';

@Component({
  selector: 'cc-drawflow-editor',
  standalone: true,
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
}

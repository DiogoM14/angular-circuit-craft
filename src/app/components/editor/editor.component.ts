import {AfterViewInit, Component, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
// @ts-ignore
import Drawflow from 'circuit-craft-core/src/drawflow.js';
import {Node3Component} from '../node3/node3.component';
import {ApiRequestComponent} from '../request-node/request-node.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  imports: []
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('canvas', {static: true}) drawflowElement!: ElementRef;
  @ViewChild('canvas', {read: ViewContainerRef}) container!: ViewContainerRef;
  private editor!: Drawflow;
  private nodeIdCounter = 0;

  ngAfterViewInit(): void {
    this.editor = new Drawflow(this.drawflowElement.nativeElement, this.container);
    this.editor.reroute = true;
    this.editor.start();

    this.addAngularNode(500, 300);
    this.addRequestNode(500, 300);

    this.editor.addConnection(1, 0, 2, 0);
  }

  private addAngularNode(x: number, y: number): void {
    this.editor.addNode('node3', 2, 2, x, y, 'Node3', {}, `<div id="${++this.nodeIdCounter}"></div>`, 'angular');

    const target = document.getElementById(this.nodeIdCounter.toString());
    if (target) {
      const componentRef = this.container.createComponent(Node3Component);
      target.appendChild(componentRef.location.nativeElement);
    }
  }

  private addRequestNode(x: number, y: number): void {
    this.editor.addNode('request-node', 1, 1, x, y, 'Request Node', {}, `<div id="${++this.nodeIdCounter}"></div>`, 'angular');

    const target = document.getElementById(this.nodeIdCounter.toString());
    if (target) {
      const componentRef = this.container.createComponent(ApiRequestComponent);
      target.appendChild(componentRef.location.nativeElement);
    }
  }
}


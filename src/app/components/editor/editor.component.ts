import {Component, ComponentRef, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
// @ts-ignore
import Drawflow from '../../services/drawflow.js';
import {JsonPipe, NgFor, NgIf} from '@angular/common';
import {Node3Component} from '../node3/node3.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  imports: [JsonPipe, NgFor, NgIf, Node3Component]
})
export class EditorComponent {
  @ViewChild('canvas', {static: true}) drawflowElement!: ElementRef;
  @ViewChild('canvas', {read: ViewContainerRef}) container!: ViewContainerRef;
  private editor!: Drawflow;
  private nodeIdCounter = 0;

  ngAfterViewInit(): void {
    this.editor = new Drawflow(this.drawflowElement.nativeElement, this.container);
    this.editor.reroute = true;
    this.editor.start();

    //const node3ComponentRef = this.container.createComponent(Node3Component);
    //this.editor.addNode('node3', 1, 1, 500, 300, 'Node3', {}, node3ComponentRef, 'angular');

    this.addAngularNode(500, 300);
    this.addAngularNode(700, 300);
    this.addAngularNode(900, 300);
  }

  private addAngularNode(x: number, y: number): void {
    //const nodeId = `angular-node-${++this.nodeIdCounter}`;
    //const wrapperId = `wrapper-${nodeId}`;
    //const html = `<div id="${wrapperId}" style="width:100%; height:100%;"></div>`;

    this.editor.addNode('node3', 1, 1, x, y, 'Node3', {}, `<div id="${++this.nodeIdCounter}"></div>`, 'angular');

    const target = document.getElementById(this.nodeIdCounter.toString());
    if (target) {
      const componentRef = this.container.createComponent(Node3Component);
      target.appendChild(componentRef.location.nativeElement);
    }
  }
}


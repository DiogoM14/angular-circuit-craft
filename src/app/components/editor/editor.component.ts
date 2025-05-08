import { AfterViewInit, Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
// @ts-ignore
import Drawflow from '../../drawflow.js';
import { Node3Component } from '../node3/node3.component';
import { ApiRequestComponent } from '../request-node/request-node.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  standalone: true,
  imports: [],
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) drawflowElement!: ElementRef;
  @ViewChild('canvas', { read: ViewContainerRef }) container!: ViewContainerRef;
  private editor!: Drawflow;
  private nodeIdCounter = 0;
  private nodeComponents: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    this.editor = new Drawflow(this.drawflowElement.nativeElement, this.container);
    this.editor.reroute = true;
    this.editor.start();

    this.addRequestNode(100, 200);
    this.addAngularNode(800, 300);

    // Listen for node connections
    this.editor.on('connectionCreated', (info: any) => {
      console.log('Connection created:', info);

      // Get the node elements to find their IDs
      const outputNode = document.querySelector(`.output_${info.output_class}`);
      const inputNode = document.querySelector(`.input_${info.input_class}`);

      if (outputNode && inputNode) {
        const sourceNodeElement = outputNode.closest('.drawflow-node');
        const targetNodeElement = inputNode.closest('.drawflow-node');

        if (sourceNodeElement && targetNodeElement) {
          const sourceNode = this.nodeComponents.get(sourceNodeElement.id);
          const targetNode = this.nodeComponents.get(targetNodeElement.id);

          if (sourceNode && targetNode) {
            console.log('Found connected nodes:', sourceNodeElement.id, targetNodeElement.id);
            sourceNode.outputChanged.subscribe((data: { name: string; value: any }) => {
              console.log('Output changed:', data);
              targetNode.onInputChange('response', data.value);
            });
          }
        }
      }
    });

    // Add the connection after setting up the listener
    this.editor.addConnection(1, 0, 2, 0);
  }

  private addAngularNode(x: number, y: number): void {
    const node3Component = new Node3Component();
    const numInputs = node3Component.getInputCount();
    const numOutputs = node3Component.getOutputCount();

    this.editor.addNode('node3', numInputs, numOutputs, x, y, 'Node3', {}, `<div id="${++this.nodeIdCounter}"></div>`, 'angular');

    const target = document.getElementById(this.nodeIdCounter.toString());
    if (target) {
      const componentRef = this.container.createComponent(Node3Component);
      target.appendChild(componentRef.location.nativeElement);
      // Store the component with the node's actual ID
      const nodeElement = target.closest('.drawflow-node');
      if (nodeElement) {
        this.nodeComponents.set(nodeElement.id, componentRef.instance);
      }
    }
  }

  private addRequestNode(x: number, y: number): void {
    const requestComponent = new ApiRequestComponent(this.http);
    const numInputs = requestComponent.getInputCount();
    const numOutputs = requestComponent.getOutputCount();

    this.editor.addNode('request-node', numInputs, numOutputs, x, y, 'Request Node', {}, `<div id="${++this.nodeIdCounter}"></div>`, 'angular');

    const target = document.getElementById(this.nodeIdCounter.toString());
    if (target) {
      const componentRef = this.container.createComponent(ApiRequestComponent);
      target.appendChild(componentRef.location.nativeElement);
      // Store the component with the node's actual ID
      const nodeElement = target.closest('.drawflow-node');
      if (nodeElement) {
        this.nodeComponents.set(nodeElement.id, componentRef.instance);
      }
    }
  }

  public handleDrop(event: any) {
    console.log('handleDrop', event);
  }

  public handleAllowDrop(event: any) {
    console.log('handleAllow', event);
  }
}

import { Injectable } from '@angular/core';
import Drawflow from 'drawflow';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DrawflowService {
  private editor!: Drawflow;
  private nodeDataChangedSubject = new Subject<{ id: string; data: any }>();

  nodeDataChanged$ = this.nodeDataChangedSubject.asObservable();

  public initializeEditor(container: HTMLElement) {
    this.editor = new Drawflow(container);
    this.editor.start();

    // Additional configuration
    this.editor.zoom_max = 1.5;
    this.editor.zoom_min = 0.5;

    // Set up event listeners
    // this.setupEventListeners();

    return this.editor;
  }

  private setupEventListeners() {
    /*    this.editor.on('nodeDataChanged', (id: string) => {
          const nodeData = this.editor.getNodeFromId(id);
          this.nodeDataChangedSubject.next({ id, data: nodeData.data });
        });

        // Listen for custom events from web components
        window.addEventListener('node-value-changed', ((event: CustomEvent) => {
          const { nodeId, value } = event.detail;
          const nodeData = this.editor.getNodeFromId(nodeId);
          if (nodeData) {
            nodeData.data.value = value;
            this.editor.updateNodeDataFromId(nodeId, nodeData.data);
          }
        }) as EventListener);*/
  }

  public addWebComponentNode(name: string, inputs: number, outputs: number, posX: number, posY: number, data: any) {
    const htmlContent = `
      <node-content-element
        title="${data.title || 'Node'}"
        value="${data.value || ''}"
        id="node-content-${Date.now()}"
        data-node-id=""
      ></node-content-element>
    `;

    const nodeId = this.editor.addNode(name, inputs, outputs, posX, posY, name, data, htmlContent, false);

    this.setupWebComponentEventListeners(nodeId.toString());
    return nodeId;
  }

  private setupWebComponentEventListeners(nodeId: string) {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (!nodeElement) return;

    const webComponent = nodeElement.querySelector('node-content-element');
    if (!webComponent) return;

    webComponent.setAttribute('data-node-id', nodeId);

    webComponent.addEventListener('valueChange', (event: Event) => {
      const customEvent = event as CustomEvent;
      const value = customEvent.detail;
      const nodeData = this.editor.getNodeFromId(nodeId);

      if (nodeData) {
        nodeData.data.value = value;
        this.editor.updateNodeDataFromId(nodeId, nodeData.data);
      }
    });
  }

  public exportFlow() {
    return this.editor.export();
  }

  public importFlow(data: string) {
    this.editor.import(data);
    this.setupAllWebComponentEventListeners();
  }

  private setupAllWebComponentEventListeners() {
    const modules = this.editor.drawflow.drawflow;
    Object.keys(modules).forEach(moduleName => {
      const nodes = modules[moduleName].data;
      Object.keys(nodes).forEach(nodeId => {
        this.setupWebComponentEventListeners(nodeId);
      });
    });
  }
}

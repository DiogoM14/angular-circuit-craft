import { Injectable } from '@angular/core';
import { SimpleConnectorTemplate } from '../types';

declare var Drawflow: any;

@Injectable({
  providedIn: 'root'
})
export class DrawflowService {
  private editor: any;

  initializeDrawflow(container: HTMLElement, callbacks: any): void {
    this.editor = new Drawflow(container);
    this.editor.start();

    this.editor.on('nodeSelected', (id: string) => {
      if (!callbacks.isDragging()) {
        callbacks.onNodeSelected(id);
      }
    });

    this.editor.on('nodeUnselected', () => {
      if (!callbacks.isDragging()) {
        callbacks.onNodeUnselected();
      }
    });

    this.editor.on('nodeMoved', () => {
      callbacks.onNodeMoved();
    });

    this.editor.on('nodeRemoved', () => {
      callbacks.onNodeRemoved();
    });

    this.editor.on('connectionCreated', () => {
      callbacks.onConnectionCreated();
    });

    this.editor.on('connectionRemoved', () => {
      callbacks.onConnectionRemoved();
    });

    this.setupEventListeners(container, callbacks);
  }

  private setupEventListeners(container: HTMLElement, callbacks: any): void {
    container.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.target && (e.target as HTMLElement).closest('.drawflow-node')) {
        callbacks.setDragging(true);
      }
    });

    container.addEventListener('mouseup', (e: MouseEvent) => {
      setTimeout(() => {
        callbacks.setDragging(false);
      }, 50);
    });

    container.addEventListener('dblclick', (e: MouseEvent) => {
      const nodeElement = (e.target as HTMLElement).closest('.drawflow-node');
      if (nodeElement) {
        const nodeId = nodeElement.id.replace('node-', '');
        callbacks.onNodeDoubleClick(nodeId);
      }
    });
  }

  createNode(connector: SimpleConnectorTemplate, x: number, y: number): void {
    if (!this.editor) return;

    const nodeHtml = this.generateNodeHtml(connector);

    this.editor.addNode(
      connector.id,
      connector.inputs,
      connector.outputs,
      x,
      y,
      connector.id,
      { ...connector.configSchema },
      nodeHtml
    );
  }

  private generateNodeHtml(connector: SimpleConnectorTemplate): string {
    const nodeTypeClass = `node-type-${connector.id}`;
    return `
      <div class="modern-node ${nodeTypeClass}">
        <div class="node-header">
          <div class="node-icon-container">
            <span class="node-icon">${connector.icon}</span>
          </div>
          <div class="node-title">
            <span class="node-name">${connector.name}</span>
          </div>
        </div>
        <div class="node-content">
          <div class="node-description">${connector.description}</div>
        </div>
      </div>
    `;
  }

  getNodeFromId(id: string): any {
    return this.editor ? this.editor.getNodeFromId(id) : null;
  }

  updateNodeDataFromId(id: string, data: any): void {
    if (this.editor) {
      this.editor.updateNodeDataFromId(id, data);
    }
  }

  removeNodeId(id: string): void {
    if (this.editor) {
      this.editor.removeNodeId(id);
    }
  }

  clear(): void {
    if (this.editor) {
      this.editor.clear();
    }
  }

  export(): any {
    return this.editor ? this.editor.export() : null;
  }

  import(data: any): void {
    if (this.editor) {
      this.editor.import(data);
    }
  }

  zoomIn(): void {
    if (this.editor) {
      this.editor.zoom_in();
    }
  }

  zoomOut(): void {
    if (this.editor) {
      this.editor.zoom_out();
    }
  }

  zoomReset(): void {
    if (this.editor) {
      this.editor.zoom_reset();
    }
  }

  updateStats(): { nodeCount: number; connectionCount: number } {
    if (!this.editor) return { nodeCount: 0, connectionCount: 0 };

    const exportData = this.editor.export();
    const nodeCount = Object.keys(exportData.drawflow.Home.data).length;
    const connectionCount = Object.values(exportData.drawflow.Home.data)
      .reduce((total: number, node: any) => total + Object.keys(node.outputs || {}).length, 0);

    return { nodeCount, connectionCount };
  }

  updateNodesWithResults(executionResults: { [nodeId: string]: any }): void {
    Object.keys(executionResults).forEach(nodeId => {
      const result = executionResults[nodeId];
      const nodeElement = document.querySelector(`#node-${nodeId}`);

      if (nodeElement) {
        nodeElement.classList.remove('executing', 'success', 'error');

        if (result && !executionResults[nodeId + '_error']) {
          nodeElement.classList.add('success');
        } else if (executionResults[nodeId + '_error']) {
          nodeElement.classList.add('error');
        }

        const statusDot = nodeElement.querySelector('.status-dot');
        if (statusDot) {
          if (result && !executionResults[nodeId + '_error']) {
            (statusDot as HTMLElement).style.background = '#10b981';
          } else if (executionResults[nodeId + '_error']) {
            (statusDot as HTMLElement).style.background = '#ef4444';
          }
        }
      }
    });
  }

  setNodeExecuting(nodeId: string): void {
    const nodeElement = document.querySelector(`#node-${nodeId}`);
    if (nodeElement) {
      nodeElement.classList.remove('success', 'error');
      nodeElement.classList.add('executing');

      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#3b82f6';
      }
    }
  }

  resetNodeStates(): void {
    const nodeElements = document.querySelectorAll('.drawflow-node');
    nodeElements.forEach(nodeElement => {
      nodeElement.classList.remove('executing', 'success', 'error');

      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#9ca3af';
      }
    });
  }

  getEditor(): any {
    return this.editor;
  }
} 
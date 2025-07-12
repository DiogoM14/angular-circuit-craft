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

        // Verificar se há erro para este nó
        const hasError = executionResults[nodeId + '_error'] || 
                        (result && result.error) ||
                        (result && result.status === 'error');

        if (hasError) {
          nodeElement.classList.add('error');
          this.addErrorIndicator(nodeElement, executionResults[nodeId + '_error'] || result.error || 'Unknown error');
        } else if (result && !hasError) {
          nodeElement.classList.add('success');
          this.removeErrorIndicator(nodeElement);
        }

        // Atualizar status dot se existir
        const statusDot = nodeElement.querySelector('.status-dot');
        if (statusDot) {
          if (hasError) {
            (statusDot as HTMLElement).style.background = '#ef4444';
          } else if (result) {
            (statusDot as HTMLElement).style.background = '#10b981';
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
      this.removeErrorIndicator(nodeElement);

      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#3b82f6';
      }
    }
  }

  setNodeError(nodeId: string, errorMessage: string): void {
    const nodeElement = document.querySelector(`#node-${nodeId}`);
    if (nodeElement) {
      nodeElement.classList.remove('executing', 'success');
      nodeElement.classList.add('error');
      this.addErrorIndicator(nodeElement, errorMessage);

      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#ef4444';
      }

      console.error(`Node ${nodeId} marked as error:`, errorMessage);
    }
  }

  setNodeSuccess(nodeId: string): void {
    const nodeElement = document.querySelector(`#node-${nodeId}`);
    if (nodeElement) {
      nodeElement.classList.remove('executing', 'error');
      nodeElement.classList.add('success');
      this.removeErrorIndicator(nodeElement);

      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#10b981';
      }
    }
  }

  private addErrorIndicator(nodeElement: Element, errorMessage: string): void {
    // Remover indicador anterior se existir
    this.removeErrorIndicator(nodeElement);

    // Criar indicador de erro
    const errorIndicator = document.createElement('div');
    errorIndicator.className = 'error-indicator';
    errorIndicator.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-tooltip">
        <div class="error-title">Execution Error</div>
        <div class="error-message">${this.escapeHtml(errorMessage)}</div>
      </div>
    `;

    // Adicionar ao nó
    nodeElement.appendChild(errorIndicator);

    // Adicionar eventos para mostrar/esconder tooltip
    let tooltipTimeout: any;
    
    errorIndicator.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
      const tooltip = errorIndicator.querySelector('.error-tooltip') as HTMLElement;
      if (tooltip) {
        // Ajustar posicionamento do tooltip baseado na posição do nó
        const nodeRect = nodeElement.getBoundingClientRect();
        const containerRect = nodeElement.closest('.drawflow')?.getBoundingClientRect();
        
        if (containerRect && nodeRect) {
          const relativeTop = nodeRect.top - containerRect.top;
          const relativeRight = containerRect.right - nodeRect.right;
          
          // Se o nó está muito à direita, mostrar tooltip à esquerda
          if (relativeRight < 320) {
            tooltip.style.right = 'auto';
            tooltip.style.left = '-280px';
          }
          
          // Se o nó está muito em cima, mostrar tooltip abaixo
          if (relativeTop < 100) {
            tooltip.style.top = '30px';
          }
        }
        
        tooltip.style.display = 'block';
      }
    });

    errorIndicator.addEventListener('mouseleave', () => {
      tooltipTimeout = setTimeout(() => {
        const tooltip = errorIndicator.querySelector('.error-tooltip') as HTMLElement;
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }, 100); // Pequeno delay para evitar flickering
    });

    // Também esconder se clicar fora
    document.addEventListener('click', (e) => {
      if (!errorIndicator.contains(e.target as Node)) {
        const tooltip = errorIndicator.querySelector('.error-tooltip') as HTMLElement;
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    });
  }

  private removeErrorIndicator(nodeElement: Element): void {
    const existingIndicator = nodeElement.querySelector('.error-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  resetNodeStates(): void {
    const nodeElements = document.querySelectorAll('.drawflow-node');
    nodeElements.forEach(nodeElement => {
      nodeElement.classList.remove('executing', 'success', 'error');
      this.removeErrorIndicator(nodeElement);

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
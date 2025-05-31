// app.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var Drawflow: any;

interface NodeData {
  id: string;
  name: string;
  type: string;
  inputs: number;
  outputs: number;
  config: any;
}

interface ConnectorTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  inputs: number;
  outputs: number;
  configSchema: any;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: "./app.component.scss"
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('drawflowContainer', { static: false }) drawflowContainer!: ElementRef;

  private editor: any;
  searchTerm = '';
  workflowName = 'Novo Workflow';
  selectedNode: NodeData | null = null;
  nodeCount = 0;
  connectionCount = 0;
  workflowStatus = 'Pronto';
  currentZoom = 100;

  categories = [
    { name: 'HTTP & APIs', expanded: true },
    { name: 'Dados & Transformação', expanded: true },
    { name: 'Lógica & Controle', expanded: false },
    { name: 'Notificações', expanded: false },
    { name: 'Armazenamento', expanded: false }
  ];

  connectorTemplates: ConnectorTemplate[] = [
    {
      id: 'http-request',
      name: 'HTTP Request',
      category: 'HTTP & APIs',
      icon: '🌐',
      description: 'Faz requisições HTTP para APIs externas',
      inputs: 1,
      outputs: 1,
      configSchema: { url: '', method: 'GET', headers: '{}' }
    },
    {
      id: 'webhook',
      name: 'Webhook',
      category: 'HTTP & APIs',
      icon: '🔗',
      description: 'Recebe dados via webhook',
      inputs: 0,
      outputs: 1,
      configSchema: { path: '/webhook', method: 'POST' }
    },
    {
      id: 'display-data',
      name: 'Display Data',
      category: 'Dados & Transformação',
      icon: '📊',
      description: 'Exibe dados em diferentes formatos',
      inputs: 1,
      outputs: 0,
      configSchema: { format: 'table' }
    },
    {
      id: 'filter',
      name: 'Filter',
      category: 'Dados & Transformação',
      icon: '🔍',
      description: 'Filtra dados baseado em condições',
      inputs: 1,
      outputs: 1,
      configSchema: { condition: '' }
    },
    {
      id: 'transform',
      name: 'Transform',
      category: 'Dados & Transformação',
      icon: '🔄',
      description: 'Transforma estrutura dos dados',
      inputs: 1,
      outputs: 1,
      configSchema: { mapping: '{}' }
    },
    {
      id: 'if-condition',
      name: 'If Condition',
      category: 'Lógica & Controle',
      icon: '🔀',
      description: 'Condição if/else para controle de fluxo',
      inputs: 1,
      outputs: 2,
      configSchema: { condition: '' }
    },
    {
      id: 'delay',
      name: 'Delay',
      category: 'Lógica & Controle',
      icon: '⏱️',
      description: 'Adiciona delay na execução',
      inputs: 1,
      outputs: 1,
      configSchema: { delay: 1000 }
    },
    {
      id: 'email',
      name: 'Send Email',
      category: 'Notificações',
      icon: '📧',
      description: 'Envia emails via SMTP',
      inputs: 1,
      outputs: 1,
      configSchema: { to: '', subject: '', body: '' }
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Notificações',
      icon: '💬',
      description: 'Envia mensagens para o Slack',
      inputs: 1,
      outputs: 1,
      configSchema: { channel: '', message: '' }
    },
    {
      id: 'database',
      name: 'Database',
      category: 'Armazenamento',
      icon: '🗄️',
      description: 'Conecta com bancos de dados',
      inputs: 1,
      outputs: 1,
      configSchema: { query: '', connection: '' }
    },
    {
      id: 'file-storage',
      name: 'File Storage',
      category: 'Armazenamento',
      icon: '📁',
      description: 'Upload/download de arquivos',
      inputs: 1,
      outputs: 1,
      configSchema: { action: 'read', path: '' }
    }
  ];

  filteredConnectors = [...this.connectorTemplates];

  ngOnInit() {
    // Carrega a biblioteca Drawflow
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
    script.onload = () => {
      this.initializeDrawflow();
    };
    document.head.appendChild(script);

    // Carrega CSS do Drawflow
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.css';
    document.head.appendChild(link);
  }

  ngAfterViewInit() {
    // Drawflow será inicializado quando o script carregar
  }

  initializeDrawflow() {
    if (this.drawflowContainer) {
      this.editor = new Drawflow(this.drawflowContainer.nativeElement);
      this.editor.start();

      // Eventos do editor
      this.editor.on('nodeSelected', (id: string) => {
        this.onNodeSelected(id);
      });

      this.editor.on('nodeUnselected', () => {
        this.selectedNode = null;
      });

      this.editor.on('nodeRemoved', () => {
        this.updateStats();
      });

      this.editor.on('connectionCreated', () => {
        this.updateStats();
      });

      this.editor.on('connectionRemoved', () => {
        this.updateStats();
      });
    }
  }

  onDragStart(event: DragEvent, connector: ConnectorTemplate) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(connector));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && this.editor) {
      const connectorData = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.createNode(connectorData, event.offsetX, event.offsetY);
    }
  }

  createNode(connector: ConnectorTemplate, x: number, y: number) {
    const nodeId = `node_${Date.now()}`;
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

    this.updateStats();
  }

  generateNodeHtml(connector: ConnectorTemplate): string {
    return `
      <div class="node-header">
        <span>${connector.icon}</span>
        <span>${connector.name}</span>
      </div>
      <div class="node-content">
        <div class="node-description">${connector.description}</div>
      </div>
    `;
  }

  onNodeSelected(id: string) {
    const nodeData = this.editor.getNodeFromId(id);
    if (nodeData) {
      this.selectedNode = {
        id: id,
        name: nodeData.name || 'Node sem nome',
        type: nodeData.class || 'unknown',
        inputs: nodeData.inputs || 0,
        outputs: nodeData.outputs || 0,
        config: nodeData.data || {}
      };
    }
  }

  updateNodeProperties() {
    if (this.selectedNode && this.editor) {
      // Atualiza as propriedades do node no editor
      this.editor.updateNodeDataFromId(this.selectedNode.id, this.selectedNode.config);
    }
  }

  deleteSelectedNode() {
    if (this.selectedNode && this.editor) {
      this.editor.removeNodeId(this.selectedNode.id);
      this.selectedNode = null;
      this.updateStats();
    }
  }

  filterConnectors() {
    if (!this.searchTerm.trim()) {
      this.filteredConnectors = [...this.connectorTemplates];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredConnectors = this.connectorTemplates.filter(connector =>
        connector.name.toLowerCase().includes(term) ||
        connector.description.toLowerCase().includes(term)
      );
    }
  }

  getFilteredConnectors(category: string): ConnectorTemplate[] {
    return this.filteredConnectors.filter(connector => connector.category === category);
  }

  toggleCategory(categoryName: string) {
    const category = this.categories.find(cat => cat.name === categoryName);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  updateStats() {
    if (this.editor) {
      const exportData = this.editor.export();
      this.nodeCount = Object.keys(exportData.drawflow.Home.data).length;
      this.connectionCount = Object.values(exportData.drawflow.Home.data)
        .reduce((total: number, node: any) => total + Object.keys(node.outputs || {}).length, 0);
    }
  }

  clearWorkflow() {
    if (this.editor && confirm('Tem certeza que deseja limpar o workflow?')) {
      this.editor.clear();
      this.selectedNode = null;
      this.updateStats();
      this.workflowStatus = 'Limpo';
    }
  }

  saveWorkflow() {
    if (this.editor) {
      const exportData = this.editor.export();
      const workflow = {
        name: this.workflowName,
        data: exportData,
        createdAt: new Date().toISOString()
      };

      // Simula salvamento (aqui você integraria com sua API)
      localStorage.setItem('circuit_craft_workflow', JSON.stringify(workflow));
      this.workflowStatus = 'Salvo';

      console.log('Workflow salvo:', workflow);
    }
  }

  executeWorkflow() {
    if (this.editor) {
      this.workflowStatus = 'Executando...';

      // Simula execução do workflow
      setTimeout(() => {
        const exportData = this.editor.export();
        console.log('Executando workflow:', exportData);

        // Aqui você implementaria a lógica de execução real
        this.processWorkflow(exportData);

        this.workflowStatus = 'Executado com sucesso';

        setTimeout(() => {
          this.workflowStatus = 'Pronto';
        }, 2000);
      }, 1000);
    }
  }

  processWorkflow(workflowData: any) {
    // Lógica para processar e executar o workflow
    const nodes = workflowData.drawflow.Home.data;
    console.log('Processando nodes:', nodes);

    // Implementar aqui a lógica de execução baseada nos tipos de nodes
    // e suas conexões
  }

  zoomIn() {
    if (this.editor) {
      this.currentZoom = Math.min(this.currentZoom + 25, 200);
      this.editor.zoom_in();
    }
  }

  zoomOut() {
    if (this.editor) {
      this.currentZoom = Math.max(this.currentZoom - 25, 25);
      this.editor.zoom_out();
    }
  }

  resetZoom() {
    if (this.editor) {
      this.currentZoom = 100;
      this.editor.zoom_reset();
    }
  }

  loadWorkflow() {
    const saved = localStorage.getItem('circuit_craft_workflow');
    if (saved && this.editor) {
      const workflow = JSON.parse(saved);
      this.workflowName = workflow.name;
      this.editor.import(workflow.data);
      this.updateStats();
      this.workflowStatus = 'Carregado';
    }
  }
}

// app.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService, ExecutionResult } from './services/workflow.service';
import { ConnectorService, ConnectorTemplate } from './services/connectors.service';
import { HttpClient } from '@angular/common/http';

declare var Drawflow: any;

interface NodeData {
  id: string;
  name: string;
  type: string;
  inputs: number;
  outputs: number;
  config: any;
}

interface SimpleConnectorTemplate {
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
  executionResults: { [nodeId: string]: any } = {};
  previewData: { [nodeId: string]: any } = {};
  transformMappings: { [nodeId: string]: any[] } = {};
  showConfigDialog = false;
  isDragging = false;
  showLoadDialog = false;
  savedWorkflows: any[] = [];
  displayDataResults: { [nodeId: string]: any } = {};

  categories = [
    { name: 'HTTP & APIs', expanded: true },
    { name: 'Dados & Transformação', expanded: true },
    { name: 'Lógica & Controle', expanded: false },
    { name: 'Notificações', expanded: false },
    { name: 'Armazenamento', expanded: false }
  ];

  connectorTemplates: SimpleConnectorTemplate[] = [
    {
      id: 'http-request',
      name: 'HTTP Request',
      category: 'HTTP & APIs',
      icon: '🌐',
      description: 'Faz requisições HTTP para APIs externas',
      inputs: 1,
      outputs: 1,
      configSchema: { url: '', method: 'GET', headers: '{}', body: '' }
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

  constructor(
    private workflowService: WorkflowService,
    private connectorService: ConnectorService,
    private http: HttpClient
  ) {}

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

    // Carrega workflows salvos
    this.loadSavedWorkflows();
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
        if (!this.isDragging) {
          this.onNodeSelected(id);
        }
      });

      this.editor.on('nodeUnselected', () => {
        if (!this.isDragging) {
          this.selectedNode = null;
        }
      });

      this.editor.on('nodeMoved', () => {
        this.isDragging = false;
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

      // Detectar início do drag
      this.drawflowContainer.nativeElement.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.target && (e.target as HTMLElement).closest('.drawflow-node')) {
          this.isDragging = true;
        }
      });

      // Detectar fim do drag
      this.drawflowContainer.nativeElement.addEventListener('mouseup', (e: MouseEvent) => {
        setTimeout(() => {
          this.isDragging = false;
        }, 50);
      });

      // Adicionar evento de double click
      this.drawflowContainer.nativeElement.addEventListener('dblclick', (e: MouseEvent) => {
        const nodeElement = (e.target as HTMLElement).closest('.drawflow-node');
        if (nodeElement) {
          const nodeId = nodeElement.id.replace('node-', '');
          this.onNodeDoubleClick(nodeId);
        }
      });
    }
  }

  onDragStart(event: DragEvent, connector: SimpleConnectorTemplate) {
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

  createNode(connector: SimpleConnectorTemplate, x: number, y: number) {
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

  generateNodeHtml(connector: SimpleConnectorTemplate): string {
    const nodeTypeClass = `node-type-${connector.id}`;
    return `
      <div class="modern-node ${nodeTypeClass}">
        <div class="node-header">
          <div class="node-icon-container">
            <span class="node-icon">${connector.icon}</span>
          </div>
          <div class="node-title">
            <span class="node-name">${connector.name}</span>
            <span class="node-type">${connector.category}</span>
          </div>
          <div class="node-status">
            <div class="status-dot"></div>
          </div>
        </div>
        <div class="node-content">
          <div class="node-description">${connector.description}</div>
          <div class="node-meta">
            <div class="io-indicator">
              ${connector.inputs > 0 ? `<span class="input-count">${connector.inputs} <small>in</small></span>` : ''}
              ${connector.outputs > 0 ? `<span class="output-count">${connector.outputs} <small>out</small></span>` : ''}
            </div>
          </div>
        </div>
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
      
      // Inicializa mappings para transform se não existir
      if (this.selectedNode.type === 'transform') {
        if (!this.transformMappings[id]) {
          this.transformMappings[id] = this.selectedNode.config.mappings || [];
        }
        
        // Gera dados de exemplo se não há dados reais
        if (!this.getInputPreview(id)) {
          this.previewData[id] = this.generateSampleData();
        }
      }

      // NÃO abre o dialog automaticamente - só com double click
    }
  }

  // Novo método para double click
  onNodeDoubleClick(id: string) {
    this.onNodeSelected(id);
    this.openConfigDialog();
  }

  updateNodeProperties() {
    if (this.selectedNode && this.editor) {
      // Atualiza as propriedades do node no editor
      this.editor.updateNodeDataFromId(this.selectedNode.id, this.selectedNode.config);
      console.log('Node properties updated:', this.selectedNode);
    }
  }

  // Método chamado quando qualquer configuração muda
  onConfigChange() {
    this.updateNodeProperties();
  }

  deleteSelectedNode() {
    if (this.selectedNode && this.editor) {
      this.editor.removeNodeId(this.selectedNode.id);
      this.selectedNode = null;
      this.showConfigDialog = false;
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

  getFilteredConnectors(category: string): SimpleConnectorTemplate[] {
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
        id: Date.now().toString(),
        name: this.workflowName,
        data: exportData,
        createdAt: new Date().toISOString()
      };

      // Salva no localStorage
      const saved = localStorage.getItem('circuit_craft_workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(workflow);
      localStorage.setItem('circuit_craft_workflows', JSON.stringify(workflows));
      
      this.workflowStatus = 'Salvo';
      this.loadSavedWorkflows(); // Recarrega a lista

      console.log('Workflow salvo:', workflow);
    }
  }

  // Novo método para carregar workflows salvos
  loadSavedWorkflows() {
    const saved = localStorage.getItem('circuit_craft_workflows');
    this.savedWorkflows = saved ? JSON.parse(saved) : [];
  }

  // Novo método para abrir dialog de load
  openLoadDialog() {
    this.loadSavedWorkflows();
    this.showLoadDialog = true;
  }

  // Novo método para fechar dialog de load
  closeLoadDialog() {
    this.showLoadDialog = false;
  }

  // Novo método para carregar um workflow específico
  loadWorkflow(workflow: any) {
    if (this.editor) {
      this.workflowName = workflow.name;
      this.editor.import(workflow.data);
      this.updateStats();
      this.workflowStatus = 'Carregado';
      this.closeLoadDialog();
    }
  }

  // Novo método para deletar um workflow salvo
  deleteWorkflow(workflowId: string) {
    if (confirm('Tem certeza que deseja deletar este workflow?')) {
      this.savedWorkflows = this.savedWorkflows.filter(w => w.id !== workflowId);
      localStorage.setItem('circuit_craft_workflows', JSON.stringify(this.savedWorkflows));
    }
  }

  async executeWorkflow() {
    if (!this.editor) return;

    this.workflowStatus = 'Executando...';
    this.executionResults = {};
    this.displayDataResults = {}; // Reset display data
    
    // Reset visual states
    this.resetNodeStates();

    try {
      const exportData = this.editor.export();
      console.log('Iniciando execução do workflow:', exportData);

      // Converte dados do Drawflow para o formato do serviço
      const workflowData = this.convertDrawflowToWorkflow(exportData);
      
      // Executa o workflow usando o serviço
      const result = await this.processWorkflowWithService(workflowData);
      
      console.log('Resultado da execução:', result);
      this.executionResults = result.results;
      
      // Atualiza visual dos nodes com os resultados
      this.updateNodesWithResults();

      this.workflowStatus = result.status === 'completed' ? 'Executado com sucesso' : 'Erro na execução';

      if (result.status === 'failed') {
        console.error('Erros na execução:', result.errors);
      }

    } catch (error) {
      console.error('Erro na execução do workflow:', error);
      this.workflowStatus = 'Erro na execução';
    }

    // Reset status após 3 segundos
    setTimeout(() => {
      this.workflowStatus = 'Pronto';
    }, 3000);
  }

  private convertDrawflowToWorkflow(drawflowData: any): any {
    const nodes = drawflowData.drawflow.Home.data;
    const workflowNodes: any[] = [];
    const connections: any[] = [];

    // Converte nodes
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      workflowNodes.push({
        id: nodeId,
        type: node.class,
        name: node.name || node.class,
        position: { x: node.pos_x, y: node.pos_y },
        data: node.data,
        inputs: [],
        outputs: []
      });

      // Converte conexões
      Object.keys(node.outputs || {}).forEach(outputKey => {
        const output = node.outputs[outputKey];
        Object.keys(output.connections || {}).forEach(connectionKey => {
          const connection = output.connections[connectionKey];
          connections.push({
            id: `${nodeId}_${connection.node}_${outputKey}_${connection.output}`,
            sourceNode: nodeId,
            targetNode: connection.node,
            sourceOutput: outputKey,
            targetInput: connection.output
          });
        });
      });
    });

    return { nodes: workflowNodes, connections };
  }

  private async processWorkflowWithService(workflowData: any): Promise<ExecutionResult> {
    const executionResult: ExecutionResult = {
      workflowId: 'temp',
      executionId: Date.now().toString(),
      status: 'running',
      startTime: new Date(),
      results: {},
      errors: {}
    };

    try {
      // Ordena nodes topologicamente para execução
      const sortedNodes = this.topologicalSort(workflowData.nodes, workflowData.connections);

      for (const node of sortedNodes) {
        try {
          console.log(`Executando node: ${node.name} (${node.type})`);
          
          // Mostra visualmente que o node está executando
          this.setNodeExecuting(node.id);
          
          const result = await this.executeNode(node, executionResult.results, workflowData.connections);
          executionResult.results[node.id] = result;
          console.log(`Node ${node.name} executado com sucesso:`, result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          executionResult.errors[node.id] = errorMsg;
          executionResult.results[node.id + '_error'] = errorMsg;
          console.error(`Erro no node ${node.name}:`, errorMsg);
          executionResult.status = 'failed';
          break;
        }
      }

      if (executionResult.status === 'running') {
        executionResult.status = 'completed';
      }

    } catch (error) {
      executionResult.status = 'failed';
      const errorMsg = error instanceof Error ? error.message : 'Erro na execução do workflow';
      executionResult.errors['workflow'] = errorMsg;
    }

    executionResult.endTime = new Date();
    return executionResult;
  }

  private async executeNode(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): Promise<any> {
    switch (node.type) {
      case 'http-request':
        return await this.executeHttpRequest(node.data);

      case 'display-data':
        const inputData = this.getInputData(node, previousResults, connections);
        const displayResult = this.executeDisplay(inputData, node.data);
        // Armazena os dados para visualização
        this.displayDataResults[node.id] = {
          data: inputData,
          format: node.data.format || 'table',
          result: displayResult
        };
        return displayResult;

      case 'filter':
        const filterInput = this.getInputData(node, previousResults, connections);
        return this.executeFilter(filterInput, node.data.condition);

      case 'transform':
        const transformInput = this.getInputData(node, previousResults, connections);
        return this.executeTransform(transformInput, node.data);

      default:
        return { message: `Node tipo ${node.type} executado`, data: node.data };
    }
  }

  private async executeHttpRequest(config: any): Promise<any> {
    try {
      if (!config.url) {
        throw new Error('URL é obrigatória para HTTP Request');
      }

      console.log('Executando HTTP Request:', config);

      const options: any = {
        method: config.method || 'GET',
        headers: {}
      };

      // Parse headers se fornecido
      if (config.headers) {
        try {
          const headersObj = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers;
          options.headers = headersObj;
        } catch (e) {
          console.warn('Headers inválidos, usando padrão');
        }
      }

      // Adiciona body para métodos POST/PUT
      if ((config.method === 'POST' || config.method === 'PUT') && config.body) {
        try {
          options.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
          options.headers['Content-Type'] = 'application/json';
        } catch (e) {
          console.warn('Body inválido');
        }
      }

      // Faz a requisição usando fetch
      const response = await fetch(config.url, options);
      const data = await response.json();

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      throw new Error(`Erro na requisição HTTP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private executeDisplay(data: any, config: any): any {
    console.log('Exibindo dados:', data, 'no formato:', config.format);
    return {
      format: config.format || 'table',
      data: data,
      displayedAt: new Date().toISOString(),
      message: 'Dados exibidos com sucesso'
    };
  }

  private executeFilter(data: any, condition: string): any {
    // Implementação básica de filtro
    if (!Array.isArray(data)) {
      return data;
    }
    
    if (!condition) {
      return data;
    }

    // Para demo, retorna todos os itens
    console.log('Aplicando filtro:', condition, 'aos dados:', data);
    return data;
  }

  private executeTransform(data: any, config: any): any {
    try {
      if (config.mappings && Array.isArray(config.mappings)) {
        const result: any = {};
        
        config.mappings.forEach((mapping: any) => {
          if (!mapping.enabled || !mapping.targetField) return;
          
          switch (mapping.type) {
            case 'direct':
              if (mapping.sourceField) {
                result[mapping.targetField] = this.getNestedValue(data, mapping.sourceField);
              }
              break;
            case 'constant':
              result[mapping.targetField] = mapping.value;
              break;
            case 'computed':
              try {
                result[mapping.targetField] = eval(mapping.value.replace(/data\./g, 'data.'));
              } catch (e) {
                result[mapping.targetField] = mapping.value;
              }
              break;
          }
        });
        
        return result;
      }
      
      const mappingObj = config.mapping ? JSON.parse(config.mapping) : {};
      console.log('Transformando dados:', data, 'com mapping:', mappingObj);
      return { ...data, transformed: true, mapping: mappingObj };
    } catch (error) {
      throw new Error(`Erro na transformação: ${error}`);
    }
  }

  private getInputData(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): any {
    // Encontra conexões que chegam neste node
    const inputConnections = connections.filter(conn => conn.targetNode === node.id);
    
    if (inputConnections.length === 0) {
      return null;
    }

    const inputData: any[] = [];
    inputConnections.forEach(conn => {
      if (previousResults[conn.sourceNode]) {
        inputData.push(previousResults[conn.sourceNode]);
      }
    });

    return inputData.length === 1 ? inputData[0] : inputData;
  }

  private topologicalSort(nodes: any[], connections: any[]): any[] {
    const visited = new Set<string>();
    const result: any[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;

      visited.add(nodeId);

      // Visita dependências primeiro
      connections
        .filter(conn => conn.targetNode === nodeId)
        .forEach(conn => visit(conn.sourceNode));

      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        result.push(node);
      }
    };

    // Começa pelos nodes sem dependências (sources)
    const sourceNodes = nodes.filter(node => 
      !connections.some(conn => conn.targetNode === node.id)
    );

    sourceNodes.forEach(node => visit(node.id));

    // Visita nodes restantes
    nodes.forEach(node => visit(node.id));

    return result;
  }

  private updateNodesWithResults() {
    if (!this.editor) return;

    Object.keys(this.executionResults).forEach(nodeId => {
      const result = this.executionResults[nodeId];
      const nodeElement = document.querySelector(`#node-${nodeId}`);
      
      if (nodeElement) {
        // Remove estados anteriores
        nodeElement.classList.remove('executing', 'success', 'error');
        
        // Adiciona novo estado baseado no resultado
        if (result && !this.executionResults[nodeId + '_error']) {
          nodeElement.classList.add('success');
        } else if (this.executionResults[nodeId + '_error']) {
          nodeElement.classList.add('error');
        }
        
        // Atualiza o status dot se existe
        const statusDot = nodeElement.querySelector('.status-dot');
        if (statusDot) {
          if (result && !this.executionResults[nodeId + '_error']) {
            (statusDot as HTMLElement).style.background = '#10b981';
          } else if (this.executionResults[nodeId + '_error']) {
            (statusDot as HTMLElement).style.background = '#ef4444';
          }
        }
      }
    });
  }

  // Método para indicar que um node está executando
  private setNodeExecuting(nodeId: string) {
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

  // Método para resetar estados dos nodes
  private resetNodeStates() {
    const nodeElements = document.querySelectorAll('.drawflow-node');
    nodeElements.forEach(nodeElement => {
      nodeElement.classList.remove('executing', 'success', 'error');
      
      const statusDot = nodeElement.querySelector('.status-dot');
      if (statusDot) {
        (statusDot as HTMLElement).style.background = '#9ca3af';
      }
    });
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

  getInputPreview(nodeId: string): any {
    if (!this.editor) return null;
    
    const connections = this.getNodeConnections();
    const inputConnections = connections.filter((conn: any) => conn.targetNode === nodeId);
    
    if (inputConnections.length === 0) return null;
    
    const inputData: any[] = [];
    inputConnections.forEach((conn: any) => {
      if (this.executionResults[conn.sourceNode]) {
        inputData.push(this.executionResults[conn.sourceNode]);
      } else if (this.previewData[conn.sourceNode]) {
        inputData.push(this.previewData[conn.sourceNode]);
      }
    });
    
    return inputData.length === 1 ? inputData[0] : inputData;
  }

  private getNodeConnections(): any[] {
    if (!this.editor) return [];
    
    const exportData = this.editor.export();
    const nodes = exportData.drawflow.Home.data;
    const connections: any[] = [];

    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      Object.keys(node.outputs || {}).forEach(outputKey => {
        const output = node.outputs[outputKey];
        Object.keys(output.connections || {}).forEach(connectionKey => {
          const connection = output.connections[connectionKey];
          connections.push({
            sourceNode: nodeId,
            targetNode: connection.node,
            sourceOutput: outputKey,
            targetInput: connection.output
          });
        });
      });
    });

    return connections;
  }

  generateSampleData(): any {
    return {
      id: 1,
      name: "João Silva",
      email: "joao@example.com",
      age: 30,
      active: true,
      profile: {
        department: "IT",
        role: "Developer",
        salary: 5000
      },
      skills: ["JavaScript", "Angular", "Node.js"],
      metadata: {
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-20T14:45:00Z"
      }
    };
  }

  addTransformMapping(nodeId: string) {
    if (!this.transformMappings[nodeId]) {
      this.transformMappings[nodeId] = [];
    }
    
    this.transformMappings[nodeId].push({
      sourceField: '',
      targetField: '',
      type: 'direct',
      value: '',
      enabled: true
    });
    
    this.updateTransformConfig(nodeId);
  }

  removeTransformMapping(nodeId: string, index: number) {
    if (this.transformMappings[nodeId]) {
      this.transformMappings[nodeId].splice(index, 1);
      this.updateTransformConfig(nodeId);
    }
  }

  updateTransformConfig(nodeId: string) {
    if (this.selectedNode && this.selectedNode.id === nodeId) {
      this.selectedNode.config.mappings = this.transformMappings[nodeId] || [];
      this.updateNodeProperties();
    }
  }

  extractAvailableFields(data: any, prefix: string = ''): string[] {
    if (!data || typeof data !== 'object') return [];
    
    const fields: string[] = [];
    
    Object.keys(data).forEach(key => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);
      
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
        const nestedFields = this.extractAvailableFields(data[key], fieldPath);
        fields.push(...nestedFields);
      }
    });
    
    return fields;
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  generateTransformPreview(nodeId: string): any {
    const inputData = this.getInputPreview(nodeId);
    const mappings = this.transformMappings[nodeId];
    
    if (!inputData || !mappings) return null;
    
    const result: any = {};
    
    mappings.forEach(mapping => {
      if (!mapping.enabled || !mapping.targetField) return;
      
      switch (mapping.type) {
        case 'direct':
          if (mapping.sourceField) {
            result[mapping.targetField] = this.getNestedValue(inputData, mapping.sourceField);
          }
          break;
        case 'constant':
          result[mapping.targetField] = mapping.value;
          break;
        case 'computed':
          result[mapping.targetField] = mapping.value || 'computed_value';
          break;
      }
    });
    
    return result;
  }

  closeConfigDialog() {
    this.showConfigDialog = false;
  }

  openConfigDialog() {
    if (this.selectedNode) {
      this.showConfigDialog = true;
    }
  }

  // Método para obter ícone do node baseado no tipo
  getNodeIcon(type: string | undefined): string {
    const icons: { [key: string]: string } = {
      'http-request': '🌐',
      'webhook': '🔗',
      'display-data': '📊',
      'transform': '🔄',
      'filter': '🔍',
      'if-condition': '🔀',
      'delay': '⏱️',
      'email': '📧',
      'slack': '💬',
      'database': '🗄️',
      'file-storage': '📁'
    };
    return icons[type || ''] || '📦';
  }

  // Método para obter nome de exibição do node
  getNodeDisplayName(type: string | undefined): string {
    const names: { [key: string]: string } = {
      'http-request': 'HTTP Request',
      'webhook': 'Webhook Trigger',
      'display-data': 'Display Data',
      'transform': 'Transform Data',
      'filter': 'Filter Data',
      'if-condition': 'Conditional Logic',
      'delay': 'Delay Execution',
      'email': 'Send Email',
      'slack': 'Slack Notification',
      'database': 'Database Query',
      'file-storage': 'File Operations'
    };
    return names[type || ''] || 'Unknown Node';
  }

  // Método para adicionar nodes rapidamente
  addQuickStartNode(type: string) {
    const connector = this.connectorTemplates.find(c => c.id === type);
    if (connector && this.editor) {
      // Adiciona o node no centro do canvas
      const centerX = this.drawflowContainer.nativeElement.offsetWidth / 2;
      const centerY = this.drawflowContainer.nativeElement.offsetHeight / 2;
      this.createNode(connector, centerX - 100, centerY - 50);
    }
  }

  // Método para extrair colunas de dados para tabela
  getTableColumns(data: any): string[] {
    if (!data) return [];
    
    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]);
    } else if (typeof data === 'object') {
      return Object.keys(data);
    }
    
    return [];
  }

  // Método para extrair linhas de dados para tabela
  getTableRows(data: any): any[] {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object') {
      return [data];
    }
    
    return [];
  }
}
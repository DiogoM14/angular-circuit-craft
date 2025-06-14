import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { NodeData, SimpleConnectorTemplate } from './types';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { DrawflowService } from './services/drawflow.service';
import { WorkflowStorageService } from './services/workflow-storage.service';
import { addTransformMapping, removeTransformMapping, generateTransformPreview } from './helpers/data-transformation.helper';
import { 
  getNodeConnections, 
  extractAvailableFields, 
  getNestedValue, 
  getTableColumns, 
  getTableRows, 
  generateSampleData 
} from './helpers/data-utils.helper';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, CanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: "./app.component.scss"
})
export class AppComponent implements OnInit {
  @ViewChild('drawflowContainer', { static: false }) drawflowContainer!: ElementRef;

  // UI State
  searchTerm = '';
  workflowName = 'New Workflow';
  selectedNode: NodeData | null = null;
  nodeCount = 0;
  connectionCount = 0;
  workflowStatus = 'Ready';
  currentZoom = 100;
  isDragging = false;
  showConfigDialog = false;
  showLoadDialog = false;

  // Data
  executionResults: { [nodeId: string]: any } = {};
  previewData: { [nodeId: string]: any } = {};
  transformMappings: { [nodeId: string]: any[] } = {};
  displayDataResults: { [nodeId: string]: any } = {};
  savedWorkflows: any[] = [];

  categories = [
    { name: 'HTTP & APIs', expanded: true },
    { name: 'Data & Transformation', expanded: true },
    { name: 'Logic & Control', expanded: false },
    { name: 'Notifications', expanded: false },
    { name: 'Storage', expanded: false }
  ];

  connectorTemplates: SimpleConnectorTemplate[] = [
    {
      id: 'http-request',
      name: 'HTTP Request',
      category: 'HTTP & APIs',
      icon: '🌐',
      description: 'Makes HTTP requests to external APIs',
      inputs: 1,
      outputs: 1,
      configSchema: { url: '', method: 'GET', headers: '{}', body: '' }
    },
    {
      id: 'display-data',
      name: 'Display Data',
      category: 'Data & Transformation',
      icon: '📊',
      description: 'Displays data in different formats',
      inputs: 1,
      outputs: 0,
      configSchema: { format: 'table' }
    },
    {
      id: 'transform',
      name: 'Transform',
      category: 'Data & Transformation',
      icon: '🔄',
      description: 'Transforms data structure',
      inputs: 1,
      outputs: 1,
      configSchema: { mapping: '{}' }
    },
    {
      id: 'if-condition',
      name: 'If Condition',
      category: 'Logic & Control',
      icon: '🔀',
      description: 'If/else condition for flow control',
      inputs: 1,
      outputs: 2,
      configSchema: { condition: '' }
    },
    {
      id: 'delay',
      name: 'Delay',
      category: 'Logic & Control',
      icon: '⏱️',
      description: 'Adds delay to execution',
      inputs: 1,
      outputs: 1,
      configSchema: { delay: 1000 }
    },
    {
      id: 'email',
      name: 'Send Email',
      category: 'Notifications',
      icon: '📧',
      description: 'Sends emails via SMTP',
      inputs: 1,
      outputs: 1,
      configSchema: { to: '', subject: '', body: '' }
    },
    {
      id: 'database',
      name: 'Database',
      category: 'Storage',
      icon: '🗄️',
      description: 'Connects to databases',
      inputs: 1,
      outputs: 1,
      configSchema: { query: '', connection: '' }
    }
  ];

  filteredConnectors = [...this.connectorTemplates];

  constructor(
    private workflowExecutionService: WorkflowExecutionService,
    private drawflowService: DrawflowService,
    private workflowStorageService: WorkflowStorageService
  ) {}

  ngOnInit() {
    this.loadDrawflowScript();
    this.loadSavedWorkflows();
  }

  private loadDrawflowScript() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
    script.onload = () => {
      this.initializeDrawflow();
    };
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  initializeDrawflow() {
    if (this.drawflowContainer) {
      const callbacks = {
        isDragging: () => this.isDragging,
        setDragging: (value: boolean) => this.isDragging = value,
        onNodeSelected: (id: string) => this.onNodeSelected(id),
        onNodeUnselected: () => this.selectedNode = null,
        onNodeMoved: () => this.isDragging = false,
        onNodeRemoved: () => this.updateStats(),
        onConnectionCreated: () => this.updateStats(),
        onConnectionRemoved: () => this.updateStats(),
        onNodeDoubleClick: (id: string) => this.onNodeDoubleClick(id)
      };

      this.drawflowService.initializeDrawflow(this.drawflowContainer.nativeElement, callbacks);
    }
  }

  // Drag & Drop Handlers
  onDragStart(event: DragEvent, connector: SimpleConnectorTemplate) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(connector));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if ((event as any)._processed) {
      return;
    }
    (event as any)._processed = true;
    
    if (event.dataTransfer) {
      const connectorData = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.drawflowService.createNode(connectorData, event.offsetX, event.offsetY);
      this.updateStats();
    }
  }

  // Node Management
  onNodeSelected(id: string) {
    const nodeData = this.drawflowService.getNodeFromId(id);
    if (nodeData) {
      this.selectedNode = {
        id: id,
        name: nodeData.name || 'Unnamed Node',
        type: nodeData.class || 'unknown',
        inputs: nodeData.inputs || 0,
        outputs: nodeData.outputs || 0,
        config: nodeData.data || {}
      };

      if (this.selectedNode.type === 'transform') {
        if (!this.transformMappings[id]) {
          this.transformMappings[id] = this.selectedNode.config.mappings || [];
        }

        if (!this.getInputPreview(id)) {
          this.previewData[id] = generateSampleData();
        }
      }
    }
  }
  
  onNodeDoubleClick(id: string) {
    this.onNodeSelected(id);
    this.openConfigDialog();
  }

  updateNodeProperties() {
    if (this.selectedNode) {
      this.drawflowService.updateNodeDataFromId(this.selectedNode.id, this.selectedNode.config);
      console.log('Node properties updated:', this.selectedNode);
    }
  }

  onConfigChange() {
    this.updateNodeProperties();
  }

  deleteSelectedNode() {
    if (this.selectedNode) {
      this.drawflowService.removeNodeId(this.selectedNode.id);
      this.selectedNode = null;
      this.showConfigDialog = false;
      this.updateStats();
    }
  }

  // Search & Filter
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

  // Workflow Operations
  updateStats() {
    const stats = this.drawflowService.updateStats();
    this.nodeCount = stats.nodeCount;
    this.connectionCount = stats.connectionCount;
  }

  clearWorkflow() {
    if (confirm('Are you sure you want to clear the workflow?')) {
      this.drawflowService.clear();
      this.selectedNode = null;
      this.updateStats();
      this.workflowStatus = 'Cleared';
    }
  }

  saveWorkflow() {
    const exportData = this.drawflowService.export();
    if (exportData) {
      this.workflowStorageService.saveWorkflow(this.workflowName, exportData);
      this.workflowStatus = 'Saved';
      this.loadSavedWorkflows();
    }
  }

  loadSavedWorkflows() {
    this.savedWorkflows = this.workflowStorageService.loadSavedWorkflows();
  }

  openLoadDialog() {
    this.loadSavedWorkflows();
    this.showLoadDialog = true;
  }

  closeLoadDialog() {
    this.showLoadDialog = false;
  }

  loadWorkflow(workflow: any) {
    this.workflowName = workflow.name;
    this.drawflowService.import(workflow.data);
    this.updateStats();
    this.workflowStatus = 'Loaded';
    this.closeLoadDialog();
  }

  deleteWorkflow(workflowId: string) {
    if (confirm('Are you sure you want to delete this workflow?')) {
      this.savedWorkflows = this.workflowStorageService.deleteWorkflow(workflowId);
    }
  }

  // Workflow Execution
  async executeWorkflow() {
    const exportData = this.drawflowService.export();
    if (!exportData) return;

    this.workflowStatus = 'Executing...';
    this.executionResults = {};
    this.displayDataResults = {};

    this.drawflowService.resetNodeStates();

    try {
      console.log('Starting workflow execution:', exportData);

      const result = await this.workflowExecutionService.executeWorkflow(exportData);

      console.log('Execution result:', result);
      this.executionResults = result.results;

      // Handle display data results
      Object.keys(result.results).forEach(nodeId => {
        const nodeData = this.drawflowService.getNodeFromId(nodeId);
        if (nodeData && nodeData.class === 'display-data') {
          const inputData = this.getInputData(nodeId, result.results);
          this.displayDataResults[nodeId] = {
            data: inputData,
            format: nodeData.data.format || 'table',
            result: result.results[nodeId]
          };
        }
      });

      this.drawflowService.updateNodesWithResults(this.executionResults);

      this.workflowStatus = result.status === 'completed' ? 'Executed successfully' : 'Execution error';

      if (result.status === 'failed') {
        console.error('Execution errors:', result.errors);
      }

    } catch (error) {
      console.error('Workflow execution error:', error);
      this.workflowStatus = 'Execution error';
    }

    setTimeout(() => {
      this.workflowStatus = 'Ready';
    }, 3000);
  }

  // Zoom Controls
  zoomIn() {
    this.currentZoom = Math.min(this.currentZoom + 25, 200);
    this.drawflowService.zoomIn();
  }

  zoomOut() {
    this.currentZoom = Math.max(this.currentZoom - 25, 25);
    this.drawflowService.zoomOut();
  }

  resetZoom() {
    this.currentZoom = 100;
    this.drawflowService.zoomReset();
  }

  // Data Preview & Transformation
  getInputPreview(nodeId: string): any {
    const connections = getNodeConnections(this.drawflowService.getEditor());
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

  private getInputData(nodeId: string, results: { [nodeId: string]: any }): any {
    const connections = getNodeConnections(this.drawflowService.getEditor());
    const inputConnections = connections.filter((conn: any) => conn.targetNode === nodeId);

    if (inputConnections.length === 0) return null;

    const inputData: any[] = [];
    inputConnections.forEach((conn: any) => {
      if (results[conn.sourceNode]) {
        inputData.push(results[conn.sourceNode]);
      }
    });

    return inputData.length === 1 ? inputData[0] : inputData;
  }

  // Transform Mappings
  addTransformMapping(nodeId: string) {
    addTransformMapping(nodeId, this.transformMappings);
    this.updateTransformConfig(nodeId);
  }

  removeTransformMapping(nodeId: string, index: number) {
    removeTransformMapping(nodeId, index, this.transformMappings);
    this.updateTransformConfig(nodeId);
  }

  updateTransformConfig(nodeId: string) {
    if (this.selectedNode && this.selectedNode.id === nodeId) {
      this.selectedNode.config.mappings = this.transformMappings[nodeId] || [];
      this.updateNodeProperties();
    }
  }

  extractAvailableFields(data: any, prefix: string = ''): string[] {
    return extractAvailableFields(data, prefix);
  }

  getNestedValue(obj: any, path: string): any {
    return getNestedValue(obj, path);
  }

  generateTransformPreview(nodeId: string): any {
    return generateTransformPreview(
      nodeId,
      this.transformMappings,
      (id: string) => this.getInputPreview(id),
      this.previewData
    );
  }

  // Dialog Controls
  closeConfigDialog() {
    this.showConfigDialog = false;
  }

  openConfigDialog() {
    if (this.selectedNode) {
      this.showConfigDialog = true;
    }
  }

  // Utility Methods
  getNodeIcon(type: string | undefined): string {
    const icons: { [key: string]: string } = {
      'http-request': '🌐',
      'display-data': '📊',
      'transform': '🔄',
      'if-condition': '🔀',
      'delay': '⏱️',
      'email': '📧',
      'database': '🗄️'
    };
    return icons[type || ''] || '📦';
  }

  getNodeDisplayName(type: string | undefined): string {
    const names: { [key: string]: string } = {
      'http-request': 'HTTP Request',
      'display-data': 'Display Data',
      'transform': 'Transform Data',
      'if-condition': 'Conditional Logic',
      'delay': 'Delay Execution',
      'email': 'Send Email',
      'database': 'Database Query'
    };
    return names[type || ''] || 'Unknown Node';
  }

  addQuickStartNode(type: string) {
    const connector = this.connectorTemplates.find(c => c.id === type);
    if (connector) {
      const centerX = this.drawflowContainer.nativeElement.offsetWidth / 2;
      const centerY = this.drawflowContainer.nativeElement.offsetHeight / 2;
      this.drawflowService.createNode(connector, centerX - 100, centerY - 50);
      this.updateStats();
    }
  }

  getTableColumns(data: any): string[] {
    return getTableColumns(data);
  }

  getTableRows(data: any): any[] {
    return getTableRows(data);
  }

  generateSampleData(): any {
    return generateSampleData();
  }
}
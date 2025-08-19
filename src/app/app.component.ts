import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { NodeData, SimpleConnectorTemplate } from './types';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { BottomToolbarComponent } from './components/bottom-toolbar/bottom-toolbar.component';
import { WorkflowHistoryDialogComponent } from './components/dialogs/workflow-history-dialog/workflow-history-dialog.component';
import { DrawflowService } from './services/drawflow.service';
import { WorkflowExecutionService } from './services/workflow-execution.service';
import { WorkflowStorageService } from './services/workflow-storage.service';
import { WorkflowService } from './services/workflow.service';
import { WorkflowHistoryService } from './services/workflow-history.service';
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
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, CanvasComponent, BottomToolbarComponent, WorkflowHistoryDialogComponent],
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
  showHistoryDialog = false;

  // Current workflow data
  currentWorkflowId: string | null = null;

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
    private drawflowService: DrawflowService,
    private workflowExecutionService: WorkflowExecutionService,
    private workflowStorageService: WorkflowStorageService,
    private workflowService: WorkflowService,
    private workflowHistoryService: WorkflowHistoryService
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
      if (this.currentWorkflowId) {
                  // Update existing workflow
        this.workflowStorageService.updateWorkflow(this.currentWorkflowId, this.workflowName, exportData);
      } else {
                  // Create new workflow
        this.workflowStorageService.saveWorkflow(this.workflowName, exportData);
                  // Get the ID of the newly created workflow
        const workflows = this.workflowStorageService.loadSavedWorkflows();
        const latestWorkflow = workflows[workflows.length - 1];
        this.currentWorkflowId = latestWorkflow.id;
      }
      
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
    if (workflow.data) {
      this.drawflowService.import(workflow.data);
      this.workflowName = workflow.name;
      this.currentWorkflowId = workflow.id;
      this.workflowStatus = 'Loaded';
      this.closeLoadDialog();
    }
  }

  newWorkflow() {
    this.drawflowService.clear();
    this.workflowName = 'New Workflow';
    this.currentWorkflowId = null;
    this.workflowStatus = 'Ready';
    this.executionResults = {};
    this.displayDataResults = {};
    this.nodeCount = 0;
    this.connectionCount = 0;
  }

  deleteWorkflow(workflowId: string) {
    if (confirm('Are you sure you want to delete this workflow?')) {
      this.savedWorkflows = this.workflowStorageService.deleteWorkflow(workflowId);
    }
  }

      // History
  openHistoryDialog() {
    if (this.currentWorkflowId) {
      this.showHistoryDialog = true;
    } else {
              alert('Save the workflow first to view history');
    }
  }

  closeHistoryDialog() {
    this.showHistoryDialog = false;
  }

  onVersionRestored(version: number) {
    console.log(`Version ${version} restored, reloading workflow...`);
    
          // Reload the current workflow
    if (this.currentWorkflowId) {
              // First, get the restored workflow from history
      const historyEntry = this.workflowHistoryService.getWorkflowVersion(this.currentWorkflowId, version);
      if (!historyEntry) {
        console.error('History entry not found for restoration');
                  alert('Error: Version not found in history');
        return;
      }

              // Convert the workflow from history to drawflow format
      const restoredWorkflow = historyEntry.snapshot;
      console.log('Restored workflow from history:', restoredWorkflow);
      
              // Convert to drawflow data format
      const drawflowData = this.convertWorkflowToDrawflowData(restoredWorkflow);
      console.log('Converted drawflow data:', drawflowData);
      
              // Update in storage
      this.workflowStorageService.updateWorkflow(this.currentWorkflowId, restoredWorkflow.name, drawflowData);
      
              // Reload from storage
      const workflow = this.workflowStorageService.getWorkflowById(this.currentWorkflowId);
      if (workflow) {
        console.log('Loading restored workflow:', workflow);
        
                  // Clear the canvas before loading
        this.drawflowService.clear();
        
                  // Wait a bit to ensure clear was processed
        setTimeout(() => {
                      // Load the restored workflow
          if (workflow.data) {
            console.log('Importing workflow data into drawflow:', workflow.data);
            this.drawflowService.import(workflow.data);
            this.workflowName = workflow.name;
            this.updateStats();
            this.workflowStatus = `Restored to version ${version}`;
            
                          // Clear previous execution results
            this.executionResults = {};
            this.displayDataResults = {};
            
                          // Force re-rendering of node styles
            setTimeout(() => {
              this.forceNodeRerender();
              console.log('Node re-rendering completed');
              
                              // Debug: Check if nodes have correct classes
              const modernNodes = document.querySelectorAll('.modern-node');
              console.log(`Found ${modernNodes.length} modern-node elements after restoration`);
              
              modernNodes.forEach((node, index) => {
                const classList = Array.from(node.classList);
                console.log(`Node ${index}: classes = [${classList.join(', ')}]`);
              });
            }, 100);
            
            console.log('Workflow successfully restored and loaded');
          }
        }, 50);
      } else {
        console.error('Workflow not found after restoration');
                  alert('Error reloading restored workflow');
      }
    } else {
      console.error('No current workflow ID');
              alert('Error: Workflow ID not found');
    }
  }

  private forceNodeRerender() {
          // Force re-rendering of nodes to ensure styles are applied
    const nodeElements = document.querySelectorAll('.drawflow-node');
    console.log(`Found ${nodeElements.length} nodes to re-render`);
    
    nodeElements.forEach((nodeElement: Element) => {
              // Force style recalculation
      (nodeElement as HTMLElement).offsetHeight;
      
              // Re-apply classes if necessary
      const nodeId = nodeElement.id.replace('node-', '');
      const nodeContent = nodeElement.querySelector('.modern-node');
      
      if (nodeContent) {
        // Garantir que as classes estão aplicadas
        if (!nodeContent.classList.contains('modern-node')) {
          nodeContent.classList.add('modern-node');
        }
        
        console.log(`Re-rendered node ${nodeId}`);
      }
    });
  }

  private convertWorkflowToDrawflowData(workflow: any): any {
    const nodes: any = {};
    
          // Convert nodes to drawflow format
    workflow.nodes.forEach((node: any) => {
              // Find the connector template for this node type
      const connectorTemplate = this.connectorTemplates.find(template => template.id === node.type);
      
              // Create input and output structures
      const inputs: any = {};
      const outputs: any = {};
      
              // Use preserved information if available, otherwise use template
      const originalInputs = node.data?.originalInputs;
      const originalOutputs = node.data?.originalOutputs;
      const originalHtml = node.data?.originalHtml;
      
      if (originalInputs && originalInputs.length > 0) {
                  // Use preserved original inputs
        originalInputs.forEach((inputKey: string) => {
          inputs[inputKey] = { connections: [] };
        });
      } else if (connectorTemplate) {
                  // Create inputs based on template
        for (let i = 0; i < connectorTemplate.inputs; i++) {
          inputs[`input_${i + 1}`] = { connections: [] };
        }
      }
      
      if (originalOutputs && originalOutputs.length > 0) {
                  // Use preserved original outputs
        originalOutputs.forEach((outputKey: string) => {
          outputs[outputKey] = { connections: {} };
        });
      } else if (connectorTemplate) {
                  // Create outputs based on template
        for (let i = 0; i < connectorTemplate.outputs; i++) {
          outputs[`output_${i + 1}`] = { connections: {} };
        }
      }
      
              // Clean extra data to avoid polluting the node
      const cleanData = { ...node.data };
      delete cleanData.originalHtml;
      delete cleanData.originalInputs;
      delete cleanData.originalOutputs;
      
      nodes[node.id] = {
        id: parseInt(node.id),
        name: node.name,
        class: node.type,
        data: cleanData,
        html: originalHtml || this.generateNodeHtmlForRestore(node, connectorTemplate),
        typenode: false,
        inputs: inputs,
        outputs: outputs,
        pos_x: node.position.x,
        pos_y: node.position.y
      };
    });

          // Convert connections
    workflow.connections.forEach((connection: any) => {
      const sourceNode = nodes[connection.sourceNode];
      const targetNode = nodes[connection.targetNode];
      
      if (sourceNode && targetNode) {
                  // Ensure outputs and inputs exist
        if (!sourceNode.outputs[connection.sourceOutput]) {
          sourceNode.outputs[connection.sourceOutput] = { connections: {} };
        }
        
        if (!targetNode.inputs[connection.targetInput]) {
          targetNode.inputs[connection.targetInput] = { connections: [] };
        }

                  // Connect source node output to target node input
        sourceNode.outputs[connection.sourceOutput].connections[connection.id] = {
          node: connection.targetNode,
          output: connection.targetInput
        };

                  // Connect target node input to source node output
        targetNode.inputs[connection.targetInput].connections.push({
          node: connection.sourceNode,
          input: connection.sourceOutput
        });
      }
    });

    console.log('Converted workflow to drawflow data:', { drawflow: { Home: { data: nodes } } });

    return {
      drawflow: {
        Home: {
          data: nodes
        }
      }
    };
  }

  private generateNodeHtmlForRestore(node: any, connectorTemplate: any): string {
    if (!connectorTemplate) {
              // Fallback for nodes with unknown types
      const nodeTypeClass = `node-type-unknown`;
      return `
        <div class="modern-node ${nodeTypeClass}">
          <div class="node-header">
            <div class="node-icon-container">
              <span class="node-icon">❓</span>
            </div>
            <div class="node-title">
              <span class="node-name">${node.name || 'Unknown Node'}</span>
            </div>
          </div>
          <div class="node-content">
            <div class="node-description">Unknown node type: ${node.type || 'undefined'}</div>
          </div>
        </div>
      `;
    }

    const nodeTypeClass = `node-type-${connectorTemplate.id}`;
    return `
      <div class="modern-node ${nodeTypeClass}">
        <div class="node-header">
          <div class="node-icon-container">
            <span class="node-icon">${connectorTemplate.icon}</span>
          </div>
          <div class="node-title">
            <span class="node-name">${node.name || connectorTemplate.name}</span>
          </div>
        </div>
        <div class="node-content">
          <div class="node-description">${connectorTemplate.description}</div>
        </div>
      </div>
    `;
  }

  exportWorkflowWithHistory() {
    if (this.currentWorkflowId) {
      const exportData = this.workflowStorageService.exportWorkflowWithHistory(this.currentWorkflowId);
      if (exportData) {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.workflowName}_with_history.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
              alert('Save the workflow first to export with history');
    }
  }

  importWorkflowWithHistory(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          const success = this.workflowStorageService.importWorkflowWithHistory(importData);
          if (success) {
            this.loadSavedWorkflows();
            alert('Workflow imported successfully!');
          } else {
            alert('Error importing workflow');
          }
        } catch (error) {
          alert('Invalid file');
        }
      };
      reader.readAsText(file);
    }
  }

  // Workflow Execution
  async executeWorkflow() {
    const exportData = this.drawflowService.export();
    if (!exportData) return;

    this.workflowStatus = 'Executing...';
    this.executionResults = {};
    this.displayDataResults = {};

          // Reset node states
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

              // Update results visualization (including errors)
      this.drawflowService.updateNodesWithResults(this.executionResults);

              // Determine final status
      if (result.status === 'completed') {
        this.workflowStatus = 'Executed successfully';
      } else if (result.status === 'failed') {
        const errorCount = Object.keys(result.errors).length;
        this.workflowStatus = `Execution failed (${errorCount} error${errorCount > 1 ? 's' : ''})`;
        
                  // Log errors for debug
        console.error('Execution errors:', result.errors);
        
                  // Show error summary in console
        Object.entries(result.errors).forEach(([nodeId, error]) => {
          console.error(`❌ Node ${nodeId}: ${error}`);
        });
      }

              // Register execution in history if workflow was saved
      if (this.currentWorkflowId) {
        const workflow = this.workflowStorageService.getWorkflowById(this.currentWorkflowId);
        if (workflow) {
          const workflowObj = this.workflowStorageService['convertDrawflowToWorkflow'](workflow);
          const duration = result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 0;
          
                      // Determine correct status based on result
          let executionStatus: 'completed' | 'failed' = 'completed';
          if (result.status === 'failed') {
            executionStatus = 'failed';
          }
          
          this.workflowHistoryService.createHistoryEntry(
            workflowObj,
            `Workflow executed - ${result.status}`,
            'executed',
            {
              executionId: result.executionId,
              status: executionStatus,
              duration,
              nodeCount: Object.keys(exportData.drawflow.Home.data).length,
              errorCount: Object.keys(result.errors).length
            }
          );
          
          console.log(`Execution registered in history: ${executionStatus}, errors: ${Object.keys(result.errors).length}`);
        }
      }

    } catch (error) {
      console.error('Workflow execution error:', error);
      this.workflowStatus = 'Execution error';
      
              // Show general error if workflow cannot be executed
      const errorMessage = error instanceof Error ? error.message : 'Unknown execution error';
      console.error('❌ Workflow execution failed:', errorMessage);
    }

          // Reset status after a few seconds
    setTimeout(() => {
      if (this.workflowStatus.includes('Executed') || this.workflowStatus.includes('failed')) {
        this.workflowStatus = 'Ready';
      }
    }, 5000);
  }

      // Method to test errors (can be removed in production)
  testNodeError() {
    if (this.selectedNode) {
      this.drawflowService.setNodeError(this.selectedNode.id, 'Test error message for debugging');
    }
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
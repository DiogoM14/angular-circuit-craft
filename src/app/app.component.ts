import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ExecutionResult, NodeData } from './types';
import { SimpleConnectorTemplate } from './types';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CanvasComponent } from './components/canvas/canvas.component';

declare var Drawflow: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent, CanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: "./app.component.scss"
})
export class AppComponent implements OnInit {
  @ViewChild('drawflowContainer', { static: false }) drawflowContainer!: ElementRef;

  private editor: any;
  searchTerm = '';
  workflowName = 'New Workflow';
  selectedNode: NodeData | null = null;
  nodeCount = 0;
  connectionCount = 0;
  workflowStatus = 'Ready';
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


  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/drawflow@0.0.60/dist/drawflow.min.js';
    script.onload = () => {
      this.initializeDrawflow();
    };
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    this.loadSavedWorkflows();
  }

  initializeDrawflow() {
    if (this.drawflowContainer) {
      this.editor = new Drawflow(this.drawflowContainer.nativeElement);
      this.editor.start();

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

      this.drawflowContainer.nativeElement.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.target && (e.target as HTMLElement).closest('.drawflow-node')) {
          this.isDragging = true;
        }
      });

      this.drawflowContainer.nativeElement.addEventListener('mouseup', (e: MouseEvent) => {
        setTimeout(() => {
          this.isDragging = false;
        }, 50);
      });

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
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if ((event as any)._processed) {
      return;
    }
    (event as any)._processed = true;
    
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
          </div>
        </div>
        <div class="node-content">
          <div class="node-description">${connector.description}</div>
        </div>
      </div>
    `;
  }

  onNodeSelected(id: string) {
    const nodeData = this.editor.getNodeFromId(id);
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
          this.previewData[id] = this.generateSampleData();
        }
      }

    }
  }
  
  onNodeDoubleClick(id: string) {
    this.onNodeSelected(id);
    this.openConfigDialog();
  }

  updateNodeProperties() {
    if (this.selectedNode && this.editor) {
      this.editor.updateNodeDataFromId(this.selectedNode.id, this.selectedNode.config);
      console.log('Node properties updated:', this.selectedNode);
    }
  }

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
    if (this.editor && confirm('Are you sure you want to clear the workflow?')) {
      this.editor.clear();
      this.selectedNode = null;
      this.updateStats();
      this.workflowStatus = 'Cleared';
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

      const saved = localStorage.getItem('circuit_craft_workflows');
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(workflow);
      localStorage.setItem('circuit_craft_workflows', JSON.stringify(workflows));

      this.workflowStatus = 'Saved';
      this.loadSavedWorkflows();

      console.log('Workflow saved:', workflow);
    }
  }

  loadSavedWorkflows() {
    const saved = localStorage.getItem('circuit_craft_workflows');
    this.savedWorkflows = saved ? JSON.parse(saved) : [];
  }

  openLoadDialog() {
    this.loadSavedWorkflows();
    this.showLoadDialog = true;
  }

  closeLoadDialog() {
    this.showLoadDialog = false;
  }

  loadWorkflow(workflow: any) {
    if (this.editor) {
      this.workflowName = workflow.name;
      this.editor.import(workflow.data);
      this.updateStats();
      this.workflowStatus = 'Loaded';
      this.closeLoadDialog();
    }
  }

  deleteWorkflow(workflowId: string) {
    if (confirm('Are you sure you want to delete this workflow?')) {
      this.savedWorkflows = this.savedWorkflows.filter(w => w.id !== workflowId);
      localStorage.setItem('circuit_craft_workflows', JSON.stringify(this.savedWorkflows));
    }
  }

  async executeWorkflow() {
    if (!this.editor) return;

    this.workflowStatus = 'Executing...';
    this.executionResults = {};
    this.displayDataResults = {};

    this.resetNodeStates();

    try {
      const exportData = this.editor.export();
      console.log('Starting workflow execution:', exportData);

      const workflowData = this.convertDrawflowToWorkflow(exportData);

      const result = await this.processWorkflowWithService(workflowData);

      console.log('Execution result:', result);
      this.executionResults = result.results;

      this.updateNodesWithResults();

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

  private convertDrawflowToWorkflow(drawflowData: any): any {
    const nodes = drawflowData.drawflow.Home.data;
    const workflowNodes: any[] = [];
    const connections: any[] = [];

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
      const sortedNodes = this.topologicalSort(workflowData.nodes, workflowData.connections);
      const executedNodes = new Set<string>();
      const skippedNodes = new Set<string>();

      for (const node of sortedNodes) {
        try {
          // Check if this node should be executed based on conditional logic
          if (this.shouldSkipNode(node, workflowData.connections, executionResult.results, skippedNodes)) {
            console.log(`Skipping node: ${node.name} (${node.type}) - conditional path not taken`);
            skippedNodes.add(node.id);
            continue;
          }

          console.log(`Executing node: ${node.name} (${node.type})`);

          this.setNodeExecuting(node.id);

          const result = await this.executeNode(node, executionResult.results, workflowData.connections);
          executionResult.results[node.id] = result;
          executedNodes.add(node.id);

          // Handle if-condition node results for flow control
          if (node.type === 'if-condition' && result) {
            this.handleConditionalBranching(node, result, workflowData.connections, skippedNodes);
          }

          console.log(`Node ${node.name} executed successfully:`, result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          executionResult.errors[node.id] = errorMsg;
          executionResult.results[node.id + '_error'] = errorMsg;
          console.error(`Error in node ${node.name}:`, errorMsg);
          executionResult.status = 'failed';
          break;
        }
      }

      if (executionResult.status === 'running') {
        executionResult.status = 'completed';
      }

    } catch (error) {
      executionResult.status = 'failed';
      const errorMsg = error instanceof Error ? error.message : 'Workflow execution error';
      executionResult.errors['workflow'] = errorMsg;
    }

    executionResult.endTime = new Date();
    return executionResult;
  }

  private shouldSkipNode(
    node: any, 
    connections: any[], 
    results: { [nodeId: string]: any }, 
    skippedNodes: Set<string>
  ): boolean {
    // Check if any input connections come from if-condition nodes
    const inputConnections = connections.filter(conn => conn.targetNode === node.id);
    
    for (const connection of inputConnections) {
      const sourceNodeResult = results[connection.sourceNode];
      
      // If the source node is an if-condition
      if (sourceNodeResult && sourceNodeResult.executionPath !== undefined) {
        // Check if this connection should be active based on the condition result
        const shouldTakeThisPath = this.shouldTakeConditionalPath(
          connection, 
          sourceNodeResult.result
        );
        
        if (!shouldTakeThisPath) {
          return true; // Skip this node
        }
      }
      
      // If the source node was skipped, skip this node too
      if (skippedNodes.has(connection.sourceNode)) {
        return true;
      }
    }
    
    return false;
  }

  private shouldTakeConditionalPath(connection: any, conditionResult: boolean): boolean {
    // For if-condition nodes:
    // Output 0 (first output) = true path
    // Output 1 (second output) = false path
    const outputIndex = parseInt(connection.sourceOutput) || 0;
    
    if (outputIndex === 0) {
      return conditionResult === true; // True path
    } else if (outputIndex === 1) {
      return conditionResult === false; // False path
    }
    
    return true; // Default to executing if unclear
  }

  private handleConditionalBranching(
    ifNode: any, 
    result: any, 
    connections: any[], 
    skippedNodes: Set<string>
  ): void {
    // Find all output connections from this if-condition node
    const outputConnections = connections.filter(conn => conn.sourceNode === ifNode.id);
    
    outputConnections.forEach(connection => {
      const shouldTakePath = this.shouldTakeConditionalPath(connection, result.result);
      
      if (!shouldTakePath) {
        // Mark downstream nodes of this path as skipped
        this.markDownstreamNodesAsSkipped(connection.targetNode, connections, skippedNodes);
      }
    });
  }

  private markDownstreamNodesAsSkipped(
    nodeId: string, 
    connections: any[], 
    skippedNodes: Set<string>
  ): void {
    if (skippedNodes.has(nodeId)) {
      return; // Already processed
    }
    
    skippedNodes.add(nodeId);
    
    // Find downstream connections and mark those nodes as skipped too
    const downstreamConnections = connections.filter(conn => conn.sourceNode === nodeId);
    downstreamConnections.forEach(connection => {
      this.markDownstreamNodesAsSkipped(connection.targetNode, connections, skippedNodes);
    });
  }

  private async executeNode(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): Promise<any> {
    switch (node.type) {
      case 'http-request':
        return await this.executeHttpRequest(node.data);

      case 'display-data':
        const inputData = this.getInputData(node, previousResults, connections);
        const displayResult = this.executeDisplay(inputData, node.data);
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

      case 'if-condition':
        const conditionInput = this.getInputData(node, previousResults, connections);
        return this.executeIfCondition(conditionInput, node.data);

      case 'delay':
        const delayInput = this.getInputData(node, previousResults, connections);
        return await this.executeDelay(delayInput, node.data);

      default:
        return { message: `Node type ${node.type} executed`, data: node.data };
    }
  }

  private async executeHttpRequest(config: any): Promise<any> {
    try {
      if (!config.url) {
        throw new Error('URL is required for HTTP Request');
      }

      console.log('Executing HTTP Request:', config);

      const options: any = {
        method: config.method || 'GET',
        headers: {}
      };

      if (config.headers) {
        try {
          const headersObj = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers;
          options.headers = headersObj;
        } catch (e) {
          console.warn('Invalid headers, using default');
        }
      }

      if ((config.method === 'POST' || config.method === 'PUT') && config.body) {
        try {
          options.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
          options.headers['Content-Type'] = 'application/json';
        } catch (e) {
          console.warn('Invalid body');
        }
      }

      const response = await fetch(config.url, options);
      const data = await response.json();

      return {
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      throw new Error(`HTTP request error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeDisplay(data: any, config: any): any {
    console.log('Displaying data:', data, 'in format:', config.format);
    return {
      format: config.format || 'table',
      data: data,
      displayedAt: new Date().toISOString(),
      message: 'Data displayed successfully'
    };
  }

  private executeFilter(data: any, condition: string): any {  
    if (!Array.isArray(data)) {
      return data;
    }

    if (!condition) {
      return data;
    }

    console.log('Applying filter:', condition, 'to data:', data);
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
      console.log('Transforming data:', data, 'with mapping:', mappingObj);
      return { ...data, transformed: true, mapping: mappingObj };
    } catch (error) {
      throw new Error(`Transform error: ${error}`);
    }
  }

  private executeIfCondition(data: any, config: any): any {
    try {
      console.log('Executing if-condition with data:', data, 'and condition:', config.condition);
      
      if (!config.condition || config.condition.trim() === '') {
        // Default to true if no condition is set
        return {
          result: true,
          data: data,
          conditionEvaluated: 'true (no condition set)',
          executionPath: 'true'
        };
      }

      // Evaluate the condition
      const conditionResult = this.evaluateCondition(data, config.condition);
      
      return {
        result: conditionResult,
        data: data,
        conditionEvaluated: config.condition,
        executionPath: conditionResult ? 'true' : 'false'
      };
    } catch (error) {
      throw new Error(`If-condition error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeDelay(data: any, config: any): Promise<any> {
    try {
      const delayMs = parseInt(config.delay) || 1000; // Default to 1 second
      console.log(`Executing delay for ${delayMs}ms with data:`, data);
      
      // Create a promise that resolves after the specified delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return {
        data: data,
        delayExecuted: delayMs,
        executedAt: new Date().toISOString(),
        message: `Delayed execution by ${delayMs}ms`
      };
    } catch (error) {
      throw new Error(`Delay error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private evaluateCondition(data: any, condition: string): boolean {
    try {
      // Simple condition evaluation
      // Replace common patterns to make conditions more user-friendly
      let processedCondition = condition;
      
      // Handle common comparison patterns
      if (data !== null && typeof data === 'object') {
        // Replace data.field references
        processedCondition = processedCondition.replace(/data\.(\w+)/g, (match, field) => {
          const value = this.getNestedValue(data, field);
          return typeof value === 'string' ? `"${value}"` : String(value);
        });
      }
      
      // Replace 'data' with the actual data value if it's a simple comparison
      if (processedCondition.includes('data') && !processedCondition.includes('data.')) {
        const dataValue = typeof data === 'string' ? `"${data}"` : String(data);
        processedCondition = processedCondition.replace(/\bdata\b/g, dataValue);
      }
      
      // Evaluate the condition safely
      // Note: In a production environment, you might want to use a safer expression evaluator
      console.log('Evaluating condition:', processedCondition);
      
      // Simple evaluation for common cases
      if (processedCondition.includes('===') || processedCondition.includes('==')) {
        return this.evaluateSimpleComparison(processedCondition);
      }
      
      if (processedCondition.includes('>') || processedCondition.includes('<')) {
        return this.evaluateNumericComparison(processedCondition);
      }
      
      // For boolean values or simple expressions
      if (processedCondition === 'true' || processedCondition === 'false') {
        return processedCondition === 'true';
      }
      
      // Default evaluation using Function constructor (safer than eval)
      const result = new Function('return ' + processedCondition)();
      return Boolean(result);
      
    } catch (error) {
      console.warn('Condition evaluation error:', error, 'defaulting to false');
      return false;
    }
  }
  
  private evaluateSimpleComparison(condition: string): boolean {
    try {
      // Handle === and == comparisons
      const eqMatch = condition.match(/(.+?)\s*(===|==)\s*(.+)/);
      if (eqMatch) {
        const left = eqMatch[1].trim().replace(/"/g, '');
        const operator = eqMatch[2];
        const right = eqMatch[3].trim().replace(/"/g, '');
        
        if (operator === '===') {
          return left === right;
        } else {
          return left == right;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  
  private evaluateNumericComparison(condition: string): boolean {
    try {
      // Handle > < >= <= comparisons
      const numMatch = condition.match(/(.+?)\s*(>=|<=|>|<)\s*(.+)/);
      if (numMatch) {
        const left = parseFloat(numMatch[1].trim());
        const operator = numMatch[2];
        const right = parseFloat(numMatch[3].trim());
        
        if (isNaN(left) || isNaN(right)) return false;
        
        switch (operator) {
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private getInputData(node: any, previousResults: { [nodeId: string]: any }, connections: any[]): any {
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

      connections
        .filter(conn => conn.targetNode === nodeId)
        .forEach(conn => visit(conn.sourceNode));

      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        result.push(node);
      }
    };

    const sourceNodes = nodes.filter(node =>
      !connections.some(conn => conn.targetNode === node.id)
    );

    sourceNodes.forEach(node => visit(node.id));

    nodes.forEach(node => visit(node.id));

    return result;
  }

  private updateNodesWithResults() {
    if (!this.editor) return;

    Object.keys(this.executionResults).forEach(nodeId => {
      const result = this.executionResults[nodeId];
      const nodeElement = document.querySelector(`#node-${nodeId}`);

      if (nodeElement) {
        nodeElement.classList.remove('executing', 'success', 'error');

        if (result && !this.executionResults[nodeId + '_error']) {
          nodeElement.classList.add('success');
        } else if (this.executionResults[nodeId + '_error']) {
          nodeElement.classList.add('error');
        }

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
      name: "John Silva",
      email: "john@example.com",
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

  addQuickStartNode(type: string) {
    const connector = this.connectorTemplates.find(c => c.id === type);
    if (connector && this.editor) {
      const centerX = this.drawflowContainer.nativeElement.offsetWidth / 2;
      const centerY = this.drawflowContainer.nativeElement.offsetHeight / 2;
      this.createNode(connector, centerX - 100, centerY - 50);
    }
  }

  getTableColumns(data: any): string[] {
    if (!data) return [];

    if (Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]);
    } else if (typeof data === 'object') {
      return Object.keys(data);
    }

    return [];
  }

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
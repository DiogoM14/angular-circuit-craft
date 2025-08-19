import { Injectable } from '@angular/core';
import { ExecutionResult } from '../types';
import { NodeExecutionService } from './node-execution.service';
import { DrawflowService } from './drawflow.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowExecutionService {

  constructor(
    private nodeExecutionService: NodeExecutionService,
    private drawflowService: DrawflowService
  ) {}

  async executeWorkflow(drawflowData: any): Promise<ExecutionResult> {
    const executionResult: ExecutionResult = {
      workflowId: 'temp',
      executionId: Date.now().toString(),
      status: 'running',
      startTime: new Date(),
      results: {},
      errors: {}
    };

    try {
      const workflowData = this.convertDrawflowToWorkflow(drawflowData);
      const sortedNodes = this.topologicalSort(workflowData.nodes, workflowData.connections);
      const executedNodes = new Set<string>();
      const skippedNodes = new Set<string>();

      for (const node of sortedNodes) {
        try {
          if (this.shouldSkipNode(node, workflowData.connections, executionResult.results, skippedNodes)) {
            console.log(`Skipping node: ${node.name} (${node.type}) - conditional path not taken`);
            skippedNodes.add(node.id);
            continue;
          }

          console.log(`Executing node: ${node.name} (${node.type})`);

          // Mark node as executing
          this.drawflowService.setNodeExecuting(node.id);

          const result = await this.nodeExecutionService.executeNode(node, executionResult.results, workflowData.connections);
          
          // Mark node as success
          this.drawflowService.setNodeSuccess(node.id);
          
          executionResult.results[node.id] = result;
          executedNodes.add(node.id);

          if (node.type === 'if-condition' && result) {
            this.handleConditionalBranching(node, result, workflowData.connections, skippedNodes);
          }

          console.log(`Node ${node.name} executed successfully:`, result);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          
          // Mark node as error immediately
          this.drawflowService.setNodeError(node.id, errorMsg);
          
          // Register error in results
          executionResult.errors[node.id] = errorMsg;
          executionResult.results[node.id + '_error'] = errorMsg;
          
          console.error(`Error in node ${node.name}:`, errorMsg);
          executionResult.status = 'failed';
          
          // Don't stop execution if it's an optional or display node
          if (this.isOptionalNode(node.type)) {
            console.log(`Continuing execution despite error in optional node: ${node.name}`);
            continue;
          }
          
          // For critical nodes, stop execution
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
      console.error('Workflow execution failed:', errorMsg);
    }

    executionResult.endTime = new Date();
    return executionResult;
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

  private shouldSkipNode(
    node: any, 
    connections: any[], 
    results: { [nodeId: string]: any }, 
    skippedNodes: Set<string>
  ): boolean {
    const inputConnections = connections.filter(conn => conn.targetNode === node.id);
    
    for (const connection of inputConnections) {
      const sourceNodeResult = results[connection.sourceNode];
      
      if (sourceNodeResult && sourceNodeResult.executionPath !== undefined) {
        const shouldTakeThisPath = this.shouldTakeConditionalPath(
          connection, 
          sourceNodeResult.result
        );
        
        if (!shouldTakeThisPath) {
          return true;
        }
      }
      
      if (skippedNodes.has(connection.sourceNode)) {
        return true;
      }
    }
    
    return false;
  }

  private shouldTakeConditionalPath(connection: any, conditionResult: boolean): boolean {
    const outputIndex = parseInt(connection.sourceOutput) || 0;
    
    if (outputIndex === 0) {
      return conditionResult === true;
    } else if (outputIndex === 1) {
      return conditionResult === false;
    }
    
    return true;
  }

  private handleConditionalBranching(
    ifNode: any, 
    result: any, 
    connections: any[], 
    skippedNodes: Set<string>
  ): void {
    const outputConnections = connections.filter(conn => conn.sourceNode === ifNode.id);
    
    outputConnections.forEach(connection => {
      const shouldTakePath = this.shouldTakeConditionalPath(connection, result.result);
      
      if (!shouldTakePath) {
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
      return;
    }
    
    skippedNodes.add(nodeId);
    
    const downstreamConnections = connections.filter(conn => conn.sourceNode === nodeId);
    downstreamConnections.forEach(connection => {
      this.markDownstreamNodesAsSkipped(connection.targetNode, connections, skippedNodes);
    });
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

  private isOptionalNode(nodeType: string): boolean {
    // Nodes that should not stop execution in case of error
    const optionalNodeTypes = ['display-data', 'email'];
    return optionalNodeTypes.includes(nodeType);
  }
} 
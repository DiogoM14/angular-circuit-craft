import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ExecutionResult, NodeConnection, Workflow, WorkflowNode } from '../types';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private workflows = new BehaviorSubject<Workflow[]>([]);
  private currentWorkflow = new BehaviorSubject<Workflow | null>(null);

  workflows$ = this.workflows.asObservable();
  currentWorkflow$ = this.currentWorkflow.asObservable();

  constructor() {
    this.loadWorkflowsFromStorage();
  }

  createWorkflow(name: string, description: string = ''): Workflow {
    const workflow: Workflow = {
      id: this.generateId(),
      name,
      description,
      nodes: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };

    const workflows = this.workflows.value;
    workflows.push(workflow);
    this.workflows.next(workflows);
    this.saveWorkflowsToStorage();

    return workflow;
  }

  updateWorkflow(workflow: Workflow): void {
    const workflows = this.workflows.value;
    const index = workflows.findIndex(w => w.id === workflow.id);

    if (index !== -1) {
      workflow.updatedAt = new Date();
      workflows[index] = workflow;
      this.workflows.next(workflows);
      this.saveWorkflowsToStorage();

      if (this.currentWorkflow.value?.id === workflow.id) {
        this.currentWorkflow.next(workflow);
      }
    }
  }

  deleteWorkflow(workflowId: string): void {
    const workflows = this.workflows.value.filter(w => w.id !== workflowId);
    this.workflows.next(workflows);
    this.saveWorkflowsToStorage();

    if (this.currentWorkflow.value?.id === workflowId) {
      this.currentWorkflow.next(null);
    }
  }

  setCurrentWorkflow(workflow: Workflow): void {
    this.currentWorkflow.next(workflow);
  }

  async executeWorkflow(workflowId: string): Promise<ExecutionResult> {
    const workflow = this.workflows.value.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const executionResult: ExecutionResult = {
      workflowId,
      executionId: this.generateId(),
      status: 'running',
      startTime: new Date(),
      results: {},
      errors: {}
    };

    try {
      const sortedNodes = this.topologicalSort(workflow.nodes, workflow.connections);

      for (const node of sortedNodes) {
        try {
          const result = await this.executeNode(node, executionResult.results);
          executionResult.results[node.id] = result;
        } catch (error) {
          executionResult.errors[node.id] = error instanceof Error ? error.message : 'Unknown error';
          executionResult.status = 'failed';
          break;
        }
      }

      if (executionResult.status === 'running') {
        executionResult.status = 'completed';
      }

    } catch (error) {
      executionResult.status = 'failed';
      executionResult.errors['workflow'] = error instanceof Error ? error.message : 'Workflow execution error';
    }

    executionResult.endTime = new Date();
    return executionResult;
  }

  private async executeNode(node: WorkflowNode, previousResults: { [nodeId: string]: any }): Promise<any> {
    switch (node.type) {
      case 'http-request':
        return await this.executeHttpRequest(node.data);

      case 'filter':
        const inputData = this.getInputData(node, previousResults);
        return this.executeFilter(inputData, node.data.condition);

      case 'transform':
        const transformInput = this.getInputData(node, previousResults);
        return this.executeTransform(transformInput, node.data.mapping);

      case 'display-data':
        const displayInput = this.getInputData(node, previousResults);
        return this.executeDisplay(displayInput, node.data.format);

      default:
        return { message: `Node type ${node.type} executed`, data: node.data };
    }
  }

  private async executeHttpRequest(config: any): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 200,
          data: { message: 'API data', timestamp: new Date().toISOString() },
          headers: { 'content-type': 'application/json' }
        });
      }, 1000);
    });
  }

  private executeFilter(data: any[], condition: string): any[] {
    if (!Array.isArray(data)) return [];

    try {
      return data.filter((item) => {
        return true;
      });
    } catch (error) {
      throw new Error(`Filter error: ${error}`);
    }
  }

  private executeTransform(data: any, mapping: string): any {
    try {
      const mappingObj = JSON.parse(mapping);
      return { ...data, transformed: true, mapping: mappingObj };
    } catch (error) {
      throw new Error(`Transform error: ${error}`);
    }
  }

  private executeDisplay(data: any, format: string): any {
    return {
      format,
      data,
      displayedAt: new Date().toISOString()
    };
  }

  private getInputData(node: WorkflowNode, previousResults: { [nodeId: string]: any }): any {
    const inputData: any[] = [];

    node.inputs.forEach(input => {
      if (previousResults[input.sourceNode]) {
        inputData.push(previousResults[input.sourceNode]);
      }
    });

    return inputData.length === 1 ? inputData[0] : inputData;
  }

  private topologicalSort(nodes: WorkflowNode[], connections: NodeConnection[]): WorkflowNode[] {
    const visited = new Set<string>();
    const result: WorkflowNode[] = [];

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

    nodes.forEach(node => visit(node.id));

    return result;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadWorkflowsFromStorage(): void {
    try {
      const stored = localStorage.getItem('circuit_craft_workflows');
      if (stored) {
        const workflows = JSON.parse(stored);
        this.workflows.next(workflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }

  private saveWorkflowsToStorage(): void {
    try {
      const workflows = this.workflows.value;
      localStorage.setItem('circuit_craft_workflows', JSON.stringify(workflows));
    } catch (error) {
      console.error('Error saving workflows:', error);
    }
  }
}


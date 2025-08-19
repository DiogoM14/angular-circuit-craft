import { Injectable } from '@angular/core';
import { WorkflowHistoryService } from './workflow-history.service';
import { Workflow } from '../types';

@Injectable({
  providedIn: 'root'
})
export class WorkflowStorageService {
  private readonly STORAGE_KEY = 'circuit_craft_workflows';

  constructor(private workflowHistoryService: WorkflowHistoryService) {}

  saveWorkflow(workflowName: string, exportData: any): void {
    const workflow = {
      id: Date.now().toString(),
      name: workflowName,
      data: exportData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = localStorage.getItem(this.STORAGE_KEY);
    const workflows = saved ? JSON.parse(saved) : [];
    workflows.push(workflow);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));

    // Create history entry
    this.createHistoryEntryFromDrawflow(workflow, 'created');

    console.log('Workflow saved:', workflow);
  }

  updateWorkflow(workflowId: string, workflowName: string, exportData: any): void {
    const workflows = this.loadSavedWorkflows();
    const index = workflows.findIndex(w => w.id === workflowId);

    if (index !== -1) {
      workflows[index] = {
        ...workflows[index],
        name: workflowName,
        data: exportData,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));

      // Create history entry
      this.createHistoryEntryFromDrawflow(workflows[index], 'modified');

      console.log('Workflow updated:', workflows[index]);
    }
  }

  saveWorkflowWithHistory(workflow: Workflow, changeDescription: string): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const workflows = saved ? JSON.parse(saved) : [];
    
    const existingIndex = workflows.findIndex((w: any) => w.id === workflow.id);
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      data: this.convertWorkflowToDrawflow(workflow),
      createdAt: existingIndex === -1 ? new Date().toISOString() : workflows[existingIndex].createdAt,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex === -1) {
      workflows.push(workflowData);
    } else {
      workflows[existingIndex] = workflowData;
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));

    // Create history entry
    this.workflowHistoryService.createHistoryEntry(
      workflow,
      changeDescription,
      existingIndex === -1 ? 'created' : 'modified'
    );

    console.log('Workflow saved with history:', workflowData);
  }

  loadSavedWorkflows(): any[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  deleteWorkflow(workflowId: string): any[] {
    const workflows = this.loadSavedWorkflows();
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedWorkflows));

    // Remove history as well
    this.workflowHistoryService.deleteWorkflowHistory(workflowId);

    return updatedWorkflows;
  }

  getWorkflowById(workflowId: string): any | null {
    const workflows = this.loadSavedWorkflows();
    return workflows.find(w => w.id === workflowId) || null;
  }

  exportWorkflowWithHistory(workflowId: string): any {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow) return null;

    const history = this.workflowHistoryService.getWorkflowHistory(workflowId);
    const stats = this.workflowHistoryService.getHistoryStats(workflowId);

    return {
      workflow,
      history,
      stats,
      exportedAt: new Date().toISOString()
    };
  }

  importWorkflowWithHistory(importData: any): boolean {
    try {
      if (!importData.workflow) return false;

      // Generate new ID to avoid conflicts
      const newId = Date.now().toString();
      const workflow = {
        ...importData.workflow,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save workflow
      const saved = localStorage.getItem(this.STORAGE_KEY);
      const workflows = saved ? JSON.parse(saved) : [];
      workflows.push(workflow);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));

      // Import history if it exists
      if (importData.history) {
        // Create initial history entry
        this.createHistoryEntryFromDrawflow(workflow, 'created');
        
        // Add note about import
        const workflowObj = this.convertDrawflowToWorkflow(workflow);
        this.workflowHistoryService.createHistoryEntry(
          workflowObj,
          `Imported workflow with ${importData.history.totalEntries} history entries`,
          'modified'
        );
      }

      return true;
    } catch (error) {
      console.error('Error importing workflow with history:', error);
      return false;
    }
  }

  private createHistoryEntryFromDrawflow(workflowData: any, changeType: 'created' | 'modified'): void {
    try {
      const workflow = this.convertDrawflowToWorkflow(workflowData);
      const description = changeType === 'created' 
        ? `Workflow '${workflow.name}' created via storage`
        : `Workflow '${workflow.name}' updated via storage`;

      this.workflowHistoryService.createHistoryEntry(
        workflow,
        description,
        changeType
      );
    } catch (error) {
      console.error('Error creating history entry:', error);
    }
  }

  private convertDrawflowToWorkflow(workflowData: any): Workflow {
    const drawflowData = workflowData.data || {};
    const nodes = drawflowData.drawflow?.Home?.data || {};
    
    // Convert drawflow nodes to Workflow format
    const workflowNodes = Object.keys(nodes).map(nodeId => {
      const node = nodes[nodeId];
      return {
        id: nodeId,
        type: node.class || 'unknown',
        name: node.name || node.class || 'Unnamed Node',
        position: { 
          x: node.pos_x || 0, 
          y: node.pos_y || 0 
        },
        data: {
          ...node.data || {},
          // Preserve extra information for restoration
          originalHtml: node.html || '',
          originalInputs: Object.keys(node.inputs || {}),
          originalOutputs: Object.keys(node.outputs || {})
        },
        inputs: [],
        outputs: []
      };
    });

    // Convert connections
    const connections: any[] = [];
    Object.keys(nodes).forEach(nodeId => {
      const node = nodes[nodeId];
      if (node.outputs) {
        Object.keys(node.outputs).forEach(outputKey => {
          const output = node.outputs[outputKey];
          if (output.connections) {
            Object.keys(output.connections).forEach(connectionKey => {
              const connection = output.connections[connectionKey];
              connections.push({
                id: `${nodeId}_${connection.node}_${outputKey}_${connection.output}`,
                sourceNode: nodeId,
                targetNode: connection.node,
                sourceOutput: outputKey,
                targetInput: connection.output
              });
            });
          }
        });
      }
    });

    return {
      id: workflowData.id,
      name: workflowData.name || 'Unnamed Workflow',
      description: workflowData.description || '',
      nodes: workflowNodes,
      connections: connections,
      createdAt: new Date(workflowData.createdAt || Date.now()),
      updatedAt: new Date(workflowData.updatedAt || Date.now()),
      status: 'draft'
    };
  }

  private convertWorkflowToDrawflow(workflow: Workflow): any {
    const nodes: any = {};
    
    // Convert nodes to drawflow format
    workflow.nodes.forEach(node => {
      nodes[node.id] = {
        id: parseInt(node.id),
        name: node.name,
        class: node.type,
        data: node.data,
        html: node.name,
        typenode: false,
        inputs: {},
        outputs: {},
        pos_x: node.position.x,
        pos_y: node.position.y
      };
    });

    // Convert connections
    workflow.connections.forEach(connection => {
      const sourceNode = nodes[connection.sourceNode];
      const targetNode = nodes[connection.targetNode];
      
      if (sourceNode && targetNode) {
        if (!sourceNode.outputs[connection.sourceOutput]) {
          sourceNode.outputs[connection.sourceOutput] = { connections: {} };
        }
        
        if (!targetNode.inputs[connection.targetInput]) {
          targetNode.inputs[connection.targetInput] = { connections: [] };
        }

        sourceNode.outputs[connection.sourceOutput].connections[connection.id] = {
          node: connection.targetNode,
          output: connection.targetInput
        };

        targetNode.inputs[connection.targetInput].connections.push({
          node: connection.sourceNode,
          input: connection.sourceOutput
        });
      }
    });

    return {
      drawflow: {
        Home: {
          data: nodes
        }
      }
    };
  }
} 
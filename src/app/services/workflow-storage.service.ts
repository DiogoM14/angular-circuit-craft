import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WorkflowStorageService {
  private readonly STORAGE_KEY = 'circuit_craft_workflows';

  saveWorkflow(workflowName: string, exportData: any): void {
    const workflow = {
      id: Date.now().toString(),
      name: workflowName,
      data: exportData,
      createdAt: new Date().toISOString()
    };

    const saved = localStorage.getItem(this.STORAGE_KEY);
    const workflows = saved ? JSON.parse(saved) : [];
    workflows.push(workflow);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));

    console.log('Workflow saved:', workflow);
  }

  loadSavedWorkflows(): any[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  deleteWorkflow(workflowId: string): any[] {
    const workflows = this.loadSavedWorkflows();
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedWorkflows));
    return updatedWorkflows;
  }
} 
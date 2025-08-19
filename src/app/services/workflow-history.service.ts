import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Workflow, 
  WorkflowHistory, 
  WorkflowHistoryEntry, 
  WorkflowHistoryFilter,
  WorkflowVersionComparison
} from '../types';

@Injectable({
  providedIn: 'root'
})
export class WorkflowHistoryService {
  private readonly HISTORY_STORAGE_KEY = 'circuit_craft_workflow_history';
  private workflowHistories = new BehaviorSubject<{ [workflowId: string]: WorkflowHistory }>({});
  
  workflowHistories$ = this.workflowHistories.asObservable();

  constructor() {
    this.loadHistoriesFromStorage();
  }

  /**
   * Creates a new entry in the workflow history
   */
  createHistoryEntry(
    workflow: Workflow,
    changeDescription: string,
    changeType: 'created' | 'modified' | 'executed' | 'restored',
    executionData?: any
  ): WorkflowHistoryEntry {
    const histories = this.workflowHistories.value;
    const workflowHistory = histories[workflow.id] || this.createNewHistory(workflow.id);
    
    const newVersion = workflowHistory.currentVersion + 1;
    
    const historyEntry: WorkflowHistoryEntry = {
      id: this.generateId(),
      workflowId: workflow.id,
      version: newVersion,
      snapshot: { ...workflow },
      changeDescription,
      timestamp: new Date(),
      changeType,
      executionData
    };

    workflowHistory.entries.push(historyEntry);
    workflowHistory.currentVersion = newVersion;
    workflowHistory.totalEntries++;
    workflowHistory.lastModified = new Date();

    histories[workflow.id] = workflowHistory;
    this.workflowHistories.next(histories);
    this.saveHistoriesToStorage();

    return historyEntry;
  }

  /**
   * Gets the complete history of a workflow
   */
  getWorkflowHistory(workflowId: string): WorkflowHistory | null {
    const histories = this.workflowHistories.value;
    return histories[workflowId] || null;
  }

  /**
   * Gets filtered history entries
   */
  getHistoryEntries(workflowId: string, filter?: WorkflowHistoryFilter): WorkflowHistoryEntry[] {
    const history = this.getWorkflowHistory(workflowId);
    if (!history) return [];

    let entries = [...history.entries];

    if (filter) {
      if (filter.changeType) {
        entries = entries.filter(entry => entry.changeType === filter.changeType);
      }
      if (filter.dateFrom) {
        entries = entries.filter(entry => entry.timestamp >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        entries = entries.filter(entry => entry.timestamp <= filter.dateTo!);
      }
      if (filter.author) {
        entries = entries.filter(entry => entry.author === filter.author);
      }
      if (filter.limit) {
        entries = entries.slice(-filter.limit);
      }
    }

    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Gets a specific version of the workflow
   */
  getWorkflowVersion(workflowId: string, version: number): WorkflowHistoryEntry | null {
    const history = this.getWorkflowHistory(workflowId);
    if (!history) return null;

    return history.entries.find(entry => entry.version === version) || null;
  }

  /**
   * Restores a specific version of the workflow
   */
  restoreWorkflowVersion(workflowId: string, version: number): Workflow | null {
    const historyEntry = this.getWorkflowVersion(workflowId, version);
    if (!historyEntry) return null;

    const restoredWorkflow = { ...historyEntry.snapshot };
    restoredWorkflow.updatedAt = new Date();
    
    // Create a new history entry for the restoration
    this.createHistoryEntry(
      restoredWorkflow,
      `Restored from version ${version}`,
      'restored'
    );

    return restoredWorkflow;
  }

  /**
   * Compares two versions of a workflow
   */
  compareVersions(workflowId: string, oldVersion: number, newVersion: number): WorkflowVersionComparison | null {
    const oldEntry = this.getWorkflowVersion(workflowId, oldVersion);
    const newEntry = this.getWorkflowVersion(workflowId, newVersion);

    if (!oldEntry || !newEntry) return null;

    const oldWorkflow = oldEntry.snapshot;
    const newWorkflow = newEntry.snapshot;

    const differences = {
      nodesAdded: Math.max(0, newWorkflow.nodes.length - oldWorkflow.nodes.length),
      nodesRemoved: Math.max(0, oldWorkflow.nodes.length - newWorkflow.nodes.length),
      nodesModified: this.countModifiedNodes(oldWorkflow.nodes, newWorkflow.nodes),
      connectionsAdded: Math.max(0, newWorkflow.connections.length - oldWorkflow.connections.length),
      connectionsRemoved: Math.max(0, oldWorkflow.connections.length - newWorkflow.connections.length),
      metadataChanged: oldWorkflow.name !== newWorkflow.name || oldWorkflow.description !== newWorkflow.description
    };

    return {
      oldVersion: oldEntry,
      newVersion: newEntry,
      differences
    };
  }

  /**
   * Deletes the history of a workflow
   */
  deleteWorkflowHistory(workflowId: string): void {
    const histories = this.workflowHistories.value;
    delete histories[workflowId];
    this.workflowHistories.next(histories);
    this.saveHistoriesToStorage();
  }

  /**
   * Gets history statistics
   */
  getHistoryStats(workflowId: string): any {
    const history = this.getWorkflowHistory(workflowId);
    if (!history) return null;

    const entries = history.entries;
    const executionEntries = entries.filter(e => e.changeType === 'executed');
    const modificationEntries = entries.filter(e => e.changeType === 'modified');

    return {
      totalVersions: history.totalEntries,
      totalExecutions: executionEntries.length,
      totalModifications: modificationEntries.length,
      lastExecution: executionEntries.length > 0 ? executionEntries[executionEntries.length - 1].timestamp : null,
      lastModification: modificationEntries.length > 0 ? modificationEntries[modificationEntries.length - 1].timestamp : null,
      averageExecutionTime: this.calculateAverageExecutionTime(executionEntries),
      successRate: this.calculateSuccessRate(executionEntries)
    };
  }

  private createNewHistory(workflowId: string): WorkflowHistory {
    return {
      workflowId,
      entries: [],
      currentVersion: 0,
      totalEntries: 0,
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  private countModifiedNodes(oldNodes: any[], newNodes: any[]): number {
    let modified = 0;
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    
    for (const newNode of newNodes) {
      const oldNode = oldNodeMap.get(newNode.id);
      if (oldNode && JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        modified++;
      }
    }
    
    return modified;
  }

  private calculateAverageExecutionTime(executionEntries: WorkflowHistoryEntry[]): number {
    const validEntries = executionEntries.filter(e => e.executionData?.duration);
    if (validEntries.length === 0) return 0;

    const totalTime = validEntries.reduce((sum, entry) => sum + (entry.executionData?.duration || 0), 0);
    return totalTime / validEntries.length;
  }

  private calculateSuccessRate(executionEntries: WorkflowHistoryEntry[]): number {
    if (executionEntries.length === 0) return 0;

    const successfulExecutions = executionEntries.filter(e => 
      e.executionData?.status === 'completed'
    ).length;
    
    return Math.round((successfulExecutions / executionEntries.length) * 100);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private loadHistoriesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      if (stored) {
        const histories = JSON.parse(stored, (key, value) => {
          if (key === 'timestamp' || key === 'createdAt' || key === 'lastModified' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        this.workflowHistories.next(histories);
      }
    } catch (error) {
      console.error('Error loading workflow histories:', error);
    }
  }

  private saveHistoriesToStorage(): void {
    try {
      const histories = this.workflowHistories.value;
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(histories));
    } catch (error) {
      console.error('Error saving workflow histories:', error);
    }
  }
} 
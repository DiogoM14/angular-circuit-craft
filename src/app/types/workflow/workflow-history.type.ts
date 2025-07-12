import { Workflow } from './workflow.type';

export interface WorkflowHistoryEntry {
  id: string;
  workflowId: string;
  version: number;
  snapshot: Workflow;
  changeDescription: string;
  timestamp: Date;
  author?: string;
  changeType: 'created' | 'modified' | 'executed' | 'restored';
  executionData?: {
    executionId: string;
    status: 'completed' | 'failed';
    duration?: number;
    nodeCount: number;
    errorCount: number;
  };
}

export interface WorkflowHistory {
  workflowId: string;
  entries: WorkflowHistoryEntry[];
  currentVersion: number;
  totalEntries: number;
  createdAt: Date;
  lastModified: Date;
}

export interface WorkflowHistoryFilter {
  changeType?: 'created' | 'modified' | 'executed' | 'restored';
  dateFrom?: Date;
  dateTo?: Date;
  author?: string;
  limit?: number;
}

export interface WorkflowVersionComparison {
  oldVersion: WorkflowHistoryEntry;
  newVersion: WorkflowHistoryEntry;
  differences: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    connectionsAdded: number;
    connectionsRemoved: number;
    metadataChanged: boolean;
  };
} 
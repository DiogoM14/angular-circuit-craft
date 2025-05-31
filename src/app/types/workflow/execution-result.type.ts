export interface ExecutionResult {
    workflowId: string;
    executionId: string;
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    results: { [nodeId: string]: any };
    errors: { [nodeId: string]: string };
  }
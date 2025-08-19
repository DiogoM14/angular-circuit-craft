import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  WorkflowHistory, 
  WorkflowHistoryEntry, 
  WorkflowHistoryFilter,
  WorkflowVersionComparison
} from '../../../types';
import { WorkflowHistoryService } from '../../../services/workflow-history.service';
import { WorkflowService } from '../../../services/workflow.service';

@Component({
  selector: 'app-workflow-history-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-history-dialog.component.html',
  styleUrls: ['./workflow-history-dialog.component.scss']
})
export class WorkflowHistoryDialogComponent implements OnInit, OnChanges {
  @Input() workflowId: string = '';
  @Input() workflowName: string = '';
  @Input() isVisible: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() versionRestored = new EventEmitter<number>();

  workflowHistory: WorkflowHistory | null = null;
  historyEntries: WorkflowHistoryEntry[] = [];
  filteredEntries: WorkflowHistoryEntry[] = [];
  historyStats: any = null;
  
  // Filters
  filterType: string = 'all';
  filterLimit: number = 50;
  selectedEntries: WorkflowHistoryEntry[] = [];
  
  // Comparison
  showComparison: boolean = false;
  comparisonResult: WorkflowVersionComparison | null = null;
  
  // UI State
  activeTab: 'history' | 'stats' | 'comparison' = 'history';
  loading: boolean = false;
  
  constructor(
    private workflowHistoryService: WorkflowHistoryService,
    private workflowService: WorkflowService
  ) {}

  ngOnInit(): void {
    if (this.workflowId && this.isVisible) {
      this.loadWorkflowHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['workflowId'] && changes['workflowId'].currentValue) || 
        (changes['isVisible'] && changes['isVisible'].currentValue)) {
      if (this.workflowId && this.isVisible) {
        this.loadWorkflowHistory();
      }
    }
  }

  loadWorkflowHistory(): void {
    this.loading = true;
    
    this.workflowHistory = this.workflowHistoryService.getWorkflowHistory(this.workflowId);
    this.historyStats = this.workflowHistoryService.getHistoryStats(this.workflowId);
    
    this.loadHistoryEntries();
    this.loading = false;
  }

  loadHistoryEntries(): void {
    const filter: WorkflowHistoryFilter = {
      limit: this.filterLimit
    };
    
    if (this.filterType !== 'all') {
      filter.changeType = this.filterType as any;
    }
    
    this.historyEntries = this.workflowHistoryService.getHistoryEntries(this.workflowId, filter);
    this.filteredEntries = [...this.historyEntries];
  }

  onFilterChange(): void {
    this.loadHistoryEntries();
  }

  selectEntry(entry: WorkflowHistoryEntry): void {
    const index = this.selectedEntries.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      this.selectedEntries.splice(index, 1);
    } else {
      if (this.selectedEntries.length < 2) {
        this.selectedEntries.push(entry);
      } else {
        this.selectedEntries = [entry];
      }
    }
  }

  isSelected(entry: WorkflowHistoryEntry): boolean {
    return this.selectedEntries.some(e => e.id === entry.id);
  }

  restoreVersion(version: number): void {
    if (confirm(`Are you sure you want to restore version ${version}? This will create a new version of the workflow.`)) {
      const success = this.workflowService.restoreWorkflowVersion(this.workflowId, version);
      if (success) {
        this.versionRestored.emit(version);
        this.loadWorkflowHistory();
        alert(`Version ${version} restored successfully!`);
      } else {
        alert('Error restoring version');
      }
    }
  }

  compareVersions(): void {
    if (this.selectedEntries.length !== 2) {
      alert('Select exactly 2 versions to compare');
      return;
    }

    const [entry1, entry2] = this.selectedEntries.sort((a, b) => a.version - b.version);
    this.comparisonResult = this.workflowHistoryService.compareVersions(
      this.workflowId, 
      entry1.version, 
      entry2.version
    );
    
    this.showComparison = true;
    this.activeTab = 'comparison';
  }

  closeComparison(): void {
    this.showComparison = false;
    this.comparisonResult = null;
    this.selectedEntries = [];
  }

  getChangeTypeIcon(type: string): string {
    switch (type) {
      case 'created': return '✨';
      case 'modified': return '📝';
      case 'executed': return '▶️';
      case 'restored': return '🔄';
      default: return '📋';
    }
  }

  getChangeTypeLabel(type: string): string {
    switch (type) {
      case 'created': return 'Created';
      case 'modified': return 'Modified';
      case 'executed': return 'Executed';
      case 'restored': return 'Restored';
      default: return 'Unknown';
    }
  }

  getExecutionStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '❓';
    }
  }

  formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}min`;
    }
  }

  formatTimestamp(timestamp: Date): string {
    return new Date(timestamp).toLocaleString('en-US');
  }

  trackByEntryId(index: number, entry: WorkflowHistoryEntry): string {
    return entry.id;
  }

  close(): void {
    this.closeDialog.emit();
  }
} 
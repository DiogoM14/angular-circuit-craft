import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleConnectorTemplate } from '../../types';
import { Category } from './types/category.type';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() searchTerm = '';
  @Input() categories: Category[] = [];
  @Input() filteredConnectors: SimpleConnectorTemplate[] = [];
  @Input() connectorTemplates: SimpleConnectorTemplate[] = [];

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() filterConnectors = new EventEmitter<void>();
  @Output() toggleCategory = new EventEmitter<string>();
  @Output() dragStart = new EventEmitter<{event: DragEvent, connector: SimpleConnectorTemplate}>();

  onSearchTermChange(term: string) {
    this.searchTermChange.emit(term);
  }

  onFilterConnectors() {
    this.filterConnectors.emit();
  }

  onToggleCategory(categoryName: string) {
    this.toggleCategory.emit(categoryName);
  }

  onDragStart(event: DragEvent, connector: SimpleConnectorTemplate) {
    this.dragStart.emit({event, connector});
  }

  getFilteredConnectors(category: string): SimpleConnectorTemplate[] {
    return this.filteredConnectors.filter(connector => connector.category === category);
  }
} 
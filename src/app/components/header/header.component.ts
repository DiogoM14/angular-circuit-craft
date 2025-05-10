import { Component, inject } from '@angular/core';
import { DrawflowService } from '../../services/drawflow.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowDownTray, heroArrowUpTray } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'cc-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      heroArrowDownTray,
      heroArrowUpTray,
    }),
  ],
})
export class HeaderComponent {
  private drawflowService = inject(DrawflowService);

  public handleImportFlow() {
    const savedFlow = JSON.parse(localStorage.getItem('drawflow-data') || '{}');
    if (Object.keys(savedFlow).length > 0) {
      this.drawflowService.importFlow(savedFlow);
    }
  }

  public handleExportFlow() {
    const exportData = this.drawflowService.exportFlow();
    localStorage.setItem('drawflow-data', JSON.stringify(exportData));
  }
}

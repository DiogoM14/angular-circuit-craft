import { Component, OnInit } from '@angular/core';
import { DrawflowService } from '../../services/drawflow.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-node1',
  templateUrl: './node1.component.html',
  styles: [`.node-body{font-family:sans-serif;width:200px}`],
  imports: [FormsModule]
})
export class Node1Component implements OnInit {
  url = '';
  method = 'get';
  nodeId = 0;

  readonly options = [
    { value: 'get',  label: 'GET'  },
    { value: 'post', label: 'POST' }
  ];

  constructor(private dfSvc: DrawflowService) {}

  ngOnInit(): void {
    // a instância já existe quando o nó é montado
    const el = (document.currentScript?.parentElement ||     // fallback
                (document.querySelector('app-node1') as HTMLElement))
                .closest('.drawflow-node') as HTMLElement;

    this.nodeId = +el.id.replace('node-', '');
    const node = this.dfSvc.editor.getNodeFromId(this.nodeId);

    this.url    = node.data.url    ?? '';
    this.method = node.data.method ?? 'get';
  }

  updateMethod(): void { this.sync('method', this.method); }
  updateUrl(): void    { this.sync('url',    this.url);    }

  private sync(key: 'url'|'method', value: string): void {
    const node = this.dfSvc.editor.getNodeFromId(this.nodeId);
    node.data[key] = value;
    this.dfSvc.editor.updateNodeDataFromId(this.nodeId, node.data);
  }
}

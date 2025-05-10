import { Component, ViewEncapsulation, input, inject, output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-node-content',
  standalone: true,
  templateUrl: './node-content.component.html',
  styleUrl: './node-content.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class NodeContentComponent {
  private http = inject(HttpClient);

  public title = input('Node');
  public valueChange = output<string>();

  protected handleRequest() {
    this.http.get('https://pokeapi.co/api/v2/pokemon').subscribe(res => {
      this.valueChange.emit(JSON.stringify(res));
    });
  }
}

import { Component } from '@angular/core';
import { NodeComponent } from '../node/node.component';

@Component({
  selector: 'app-node3',
  imports: [],
  templateUrl: './node3.component.html',
  standalone: true,
  styleUrl: './node3.component.scss',
})
export class Node3Component extends NodeComponent {
  constructor() {
    super();
    this.addInput('response');
    this.addInput('response2');
  }

  override onInputChange(inputName: string, value: any) {
    if (inputName === 'response') {
      console.log('Node3 received response:', value);
    }
  }
}

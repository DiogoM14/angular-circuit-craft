import { Component } from '@angular/core';

@Component({
  selector: 'app-node3',
  imports: [],
  templateUrl: './node3.component.html',
  standalone: true,
  styleUrl: './node3.component.scss'
})
export class Node3Component {
  onClick() {
    console.log('clicked');
  }
}

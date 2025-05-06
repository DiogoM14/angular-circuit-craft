import { Component } from '@angular/core';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { EditorComponent } from './components/editor/editor.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [AppHeaderComponent, EditorComponent],
  standalone: true
})
export class AppComponent {
  title = 'angular-circuit-craft';
}

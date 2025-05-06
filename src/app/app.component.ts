import {Component} from '@angular/core';
import {AppHeaderComponent} from './components/app-header/app-header.component';
import {EditorComponent} from './components/editor/editor.component';
import {AppSideNavComponent} from './components/app-side-nav/app-side-nav.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [AppHeaderComponent, EditorComponent, AppSideNavComponent],
  standalone: true
})
export class AppComponent {
}

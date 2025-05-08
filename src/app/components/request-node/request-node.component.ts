import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NodeComponent } from '../node/node.component';

@Component({
  selector: 'app-request-node',
  imports: [FormsModule],
  templateUrl: './request-node.component.html',
  standalone: true,
  styleUrl: './request-node.component.scss',
})
export class ApiRequestComponent extends NodeComponent {
  methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  method = 'POST';
  url = 'pokeapi.co/api/v2/pokemon';
  response: any = null;

  constructor(private http: HttpClient) {
    super();
    this.addOutput('response');
  }

  sendRequest() {
    console.log('Sending request...');
    const fullUrl = `https://${this.url}`;

    switch (this.method) {
      case 'GET':
        this.http.get(fullUrl).subscribe(
          (res: any) => {
            console.log('Request response:', res);
            this.response = res;
            this.setOutputValue('response', res);
          },
          (err: any) => {
            console.log('Request error:', err);
            this.response = err;
            this.setOutputValue('response', err);
          }
        );
        break;
      case 'POST':
        this.http.post(fullUrl, {}).subscribe(
          (res: any) => {
            console.log('Request response:', res);
            this.response = res;
            this.setOutputValue('response', res);
          },
          (err: any) => {
            console.log('Request error:', err);
            this.response = err;
            this.setOutputValue('response', err);
          }
        );
        break;
    }
  }
}

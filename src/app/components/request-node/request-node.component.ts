import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-request-node',
  imports: [
    FormsModule
  ],
  templateUrl: './request-node.component.html',
  standalone: true,
  styleUrl: './request-node.component.scss'
})
export class ApiRequestComponent {
  methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  method = 'POST';
  url = 'pokeapi.co/api/v2/pokemon';
  response: any = null;

  constructor(private http: HttpClient) {}

  sendRequest() {
    const fullUrl = `https://${this.url}`;

    switch (this.method) {
      case 'GET':
        this.http.get(fullUrl).subscribe((res: any) => this.response = res, (err: any) => this.response = err);
        break;
      case 'POST':
        this.http.post(fullUrl, {}).subscribe((res: any) => this.response = res, (err: any) => this.response = err);
        break;
      case 'PUT':
        this.http.put(fullUrl, {}).subscribe((res: any) => this.response = res, (err: any) => this.response = err);
        break;
      case 'DELETE':
        this.http.delete(fullUrl).subscribe((res: any) => this.response = res, (err: any) => this.response = err);
        break;
      case 'PATCH':
        this.http.patch(fullUrl, {}).subscribe((res: any) => this.response = res, (err: any) => this.response = err);
        break;
    }
  }
}

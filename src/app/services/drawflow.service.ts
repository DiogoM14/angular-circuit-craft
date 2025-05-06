import { Injectable } from '@angular/core';
import Drawflow from 'drawflow';

@Injectable({ providedIn: 'root' })
export class DrawflowService {
  editor!: Drawflow;
}

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-node',
  template: '',
  standalone: true,
})
export class NodeComponent {
  private inputs: Map<string, any> = new Map();
  private outputs: Map<string, any> = new Map();
  @Output() outputChanged = new EventEmitter<{ name: string; value: any }>();

  addInput(name: string) {
    this.inputs.set(name, null);
  }

  addOutput(name: string) {
    this.outputs.set(name, null);
  }

  getInputCount(): number {
    return this.inputs.size;
  }

  getOutputCount(): number {
    return this.outputs.size;
  }

  setOutputValue(name: string, value: any) {
    console.log(`Setting output value for ${name}:`, value);
    console.warn(this.inputs);
    if (this.outputs.has(name)) {
      this.outputs.set(name, value);
      console.log('Emitting output changed event');
      this.outputChanged.emit({ name, value });
    } else {
      console.log(`Output ${name} not found`);
    }
  }

  onInputChange(inputName: string, value: any) {
    console.log(`Input ${inputName} changed:`, value);
    if (this.inputs.has(inputName)) {
      this.inputs.set(inputName, value);
    } else {
      console.log(`Input ${inputName} not found`);
    }
  }

  getInputValue(inputName: string): any {
    return this.inputs.get(inputName);
  }

  getOutputValue(outputName: string): any {
    return this.outputs.get(outputName);
  }
}

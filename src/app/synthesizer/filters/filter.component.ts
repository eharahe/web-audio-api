import { Component, Input } from '@angular/core';
import { FilterInterface } from './filters';

@Component({
  template: '',
  styleUrls: ['./filter-panel.component.css']
})
export class FilterComponent implements FilterInterface{
  @Input() settings;
  @Input() name;
  parentRef = null;
  cbRef = null;
  logFilterChangeCb(cb, parent){
    this.cbRef = cb;
    this.parentRef = parent;
  }
  onFChange(){
    (this.parentRef && this.cbRef) && this.cbRef.call(this.parentRef)
  }
}
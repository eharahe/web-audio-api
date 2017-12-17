import { Component, Input, AfterViewInit } from '@angular/core';
import { FilterComponent } from './filter.component';

@Component({
  template: '',
})
export class NoneFilterComponent extends FilterComponent implements AfterViewInit{
  @Input() settings;
  ngAfterViewInit(){
    this.onFChange()
  }
}
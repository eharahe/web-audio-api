import { Component, Input, AfterViewInit } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { FilterComponent } from './filter.component';

@Component({
  templateUrl: './lp2-filter.component.html',
  styleUrls: ['./filter-panel.component.css']
})
export class LP2FilterComponent extends FilterComponent implements AfterViewInit{
  @Input() name = 'Filter';
  @Input() settings;

  ngAfterViewInit(){
    this.onFChange()
  }
  onFreqDrag(){
    this.onFChange()
  }
  onDetuneDrag(){
    this.onFChange()
  }
  onQDrag(){
    this.onFChange()
  }
}
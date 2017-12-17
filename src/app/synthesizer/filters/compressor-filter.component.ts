import { Component, Input, AfterViewInit } from '@angular/core';
import { SuperService } from '../../core/super.service';
import { FilterComponent } from './filter.component';

@Component({
  templateUrl: './compressor-filter.component.html',
  styleUrls: ['./filter-panel.component.css']
})
export class CompressorFilterComponent extends FilterComponent implements AfterViewInit{
  @Input() name = 'Comp';
  @Input() settings;

  ngAfterViewInit(){
    this.onFChange()
  }
  onDrag(){
    this.onFChange()
  }
}
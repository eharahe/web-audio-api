import { Component, Input, OnInit, ViewChild, ComponentFactoryResolver} from '@angular/core';

import { SuperService }        from '../../core/super.service';
import { MappingType }         from '../../core/value-mapping.service';

import { VolumeMeterSettings } from '../../controls/volume';
import { SliderSettings }      from '../../controls/slider';

import { getFilterComponent, getFilterSettings, FilterInterface, FilterType } from './filters';
import { FilterDirective }     from './filter.directive';
import { FilterComponent }     from './filter.component';



@Component({
  selector : 'filter-container',
  templateUrl : './filter-panel.component.html',
  styleUrls : ['./filter-panel.component.css']
})
export class FilterPanelComponent implements OnInit{
  @Input() name = 'Filter1';
  @ViewChild(FilterDirective) filterHost: FilterDirective;

  type: FilterType = FilterType.None;
  types: Array<any>;
  sp = null;
  filterSettings = null;
  volMeter:VolumeMeterSettings = null;
  mix:SliderSettings = null;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, sp: SuperService){
    this.sp = sp;
  }

  ngOnInit(){
    this.types = [
      {name:'Bypass', id:FilterType.None},
      {name:'LP2', id:FilterType.LP2},
      {name:'HP2', id:FilterType.HP2},
      {name:'BP2', id:FilterType.BP2},
      {name:'Comp', id:FilterType.Compressor},
      {name:'Shaper', id:FilterType.WS},
    ]   
    this.volMeter = {
      id: this.name +'-volume-meter',
      LEDNum: [7,3,2],
      range: [0, 1],
      reverse: false,
      vertical: false,
      channels: [0, 0],
      unit: '',
      mapping: MappingType.Linear
    } as VolumeMeterSettings;
    this.mix = {
      id: this.name +'-mix',
      size: 125,
      range: [0, 1],
      value: .8,
      unit: '',
      mapping: MappingType.Linear
    } as SliderSettings;
    this.loadFilter();
    this.onMixDrag();
  }

  onTypeChange(e){
    this.type = e.target.value;
    this.loadFilter();
  }
  onMixDrag(){
    this.sp.filterMixChange(this.name, this.mix, this.volMeter);
  }

  loadFilter() {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(getFilterComponent(this.name, +this.type));
    let viewContainerRef = this.filterHost.viewContainerRef;
    viewContainerRef.clear();

    let componentRef = viewContainerRef.createComponent(componentFactory);
    this.filterSettings = getFilterSettings(this.name, +this.type);
    (<FilterComponent>componentRef.instance).name = this.name + this.type;
    (<FilterComponent>componentRef.instance).settings = this.filterSettings;
    (<FilterComponent>componentRef.instance).logFilterChangeCb(this.onFilterChange, this);
  }

  onFilterChange(){
    this.sp.filterChange(this.name, this.type, this.filterSettings, this.volMeter);
  }
}
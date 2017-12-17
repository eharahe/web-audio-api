import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[filter-host]',
})
export class FilterDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
import { BrowserModule }       from '@angular/platform-browser';
import { NgModule }            from '@angular/core';
import { SynthesizerModule }   from './synthesizer/synthesizer.module';
import { AppRoutingModule }    from './app.routing.module';
import { AppComponent }        from './app.component';
import { ValueMappingService } from './core/value-mapping.service';
import { SuperService }        from './core/super.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SynthesizerModule
  ],
  providers: [
    ValueMappingService,
    SuperService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

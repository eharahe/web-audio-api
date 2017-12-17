import { NgModule}                    from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule }                from '@angular/forms';

import { ControlsModule }             from '../controls/controls.module';
import { SynthesizerRoutingModule }   from './synthesizer.routing.module';

import { SynthesizerComponent }       from './synthesizer.component';
import { OscillatorComponent }        from './oscillator/oscillator.component';
import { KeyboardComponent }          from './keyboard/keyboard.component';
import { ADSRComponent }              from './modulators/adsr.component';
import { LFOComponent }               from './modulators/lfo.component';
import { SequencerComponent }         from './modulators/sequencer.component';
import { FilterComponent }            from './filters/filter.component';
import { FilterPanelComponent }       from './filters/filter-panel.component';
import { LP2FilterComponent }         from './filters/lp2-filter.component';
import { CompressorFilterComponent }  from './filters/compressor-filter.component';
import { WaveShaperFilterComponent }  from './filters/wave-shaper-filter.component';
import { NoneFilterComponent }        from './filters/none-filter.component';
import { DelayFilterComponent }       from './filters/delay-filter.component';
import { ConvolverFilterComponent }   from './filters/convolver-filter.component';

import { FilterDirective }            from './filters/filter.directive';
import { ToneFreqService }            from './keyboard/tone-freq.service';
import { ImpulseService }             from './filters/impulse.service';

@NgModule({
  imports: [
    CommonModule,
    ControlsModule,
    FormsModule,
    SynthesizerRoutingModule
  ],
  declarations: [ SynthesizerComponent,

    //osc component
    OscillatorComponent,

    //keyboard component
    KeyboardComponent,

    //modulators
    ADSRComponent,
    LFOComponent,
    SequencerComponent,

    //master inserts
    DelayFilterComponent,
    ConvolverFilterComponent,

    //filters
    FilterComponent,
    FilterPanelComponent,
    LP2FilterComponent,
    NoneFilterComponent,
    CompressorFilterComponent,
    WaveShaperFilterComponent,
    FilterDirective
  ],
  entryComponents: [
    LP2FilterComponent,
    NoneFilterComponent,
    CompressorFilterComponent,
    WaveShaperFilterComponent
  ],
  exports: [ ],
  providers: [
    ToneFreqService,
    ImpulseService
  ]
})
export class SynthesizerModule {}
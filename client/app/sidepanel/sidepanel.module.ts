import {NgModule} from '@angular/core';

import {SidepanelComponent} from './sidepanel.component';
import {PlacesComponent, PlacesItemDirective} from './places/places.component';
import {LayersComponent} from './layers/layers.component';

import {StyleFormComponent} from './layers/style-form/style-form.component';
import {StyleFormItemComponent} from './layers/style-form/style-form-item.component';
import {StyleLegendItemComponent} from './layers/style-form/style-legend-item.component';

import {LayerCopyFormComponent} from './layers/layer-copy-form/layer-copy-form.component';
import {LayerCreateFormComponent} from './layers/layer-create-form/layer-create-form.component';
import {LayerDeleteFormComponent} from './layers/layer-delete-form/layer-delete-form.component';
import {LayerShareFormComponent} from './layers/layer-share-form/layer-share-form.component';
import {LayerUpdateFormComponent} from './layers/layer-update-form/layer-update-form.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [SharedModule],
    exports: [SidepanelComponent],
    declarations: [SidepanelComponent, PlacesComponent, LayersComponent, LayerUpdateFormComponent,
        LayerShareFormComponent, LayerDeleteFormComponent, LayerCreateFormComponent, LayerCopyFormComponent,
        StyleFormComponent, StyleFormItemComponent, StyleLegendItemComponent, PlacesItemDirective]
})
export class SidepanelModule {
}

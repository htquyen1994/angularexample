import {Component, Output, EventEmitter, Input} from '@angular/core';
import {FormGroup, Validators, FormControl} from '@angular/forms';
import {
    LayerService,
    LayerDataService,
    BatchService,
    ActionMessageService,
} from '../../../shared';
import {Expression} from '../../../shared/QueryModel';
import { ILayer, IInsight, IBatchRequest } from '../../../shared/interfaces';
import { LayerType } from '../../../shared/enums';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
    selector: 'go-batch-form',
    moduleId: module.id,
    templateUrl: 'batch-form.component.html',
    styleUrls: ['batch-form.component.less']
})
export class BatchFormComponent {

    @Output() close = new EventEmitter<boolean>();
    @Input() view: IInsight;

    layers: ILayer[];
    form: FormGroup;
    layerOptions: PsSelectOption[] = [];
    constructor(private layerService: LayerService,
                private actionMessageService: ActionMessageService,
                private batchService: BatchService) {

        this.layerService.layer.subscribe(layers => {
          this.layers = layers.filter(layer => layer.type === LayerType.POLYGON);
          this.layerOptions = this.layers.map(e => ({ label: e.name, value: e.id }))
          this.form = new FormGroup({
            layer: new FormControl(this.layers[0] ? this.layers[0].id : null, Validators.required)
          });
        });

        this.layerService.layerRefresh.subscribe(layer=>{
            let index = this.layers.findIndex(e=>e.id == layer.id);
            if(index != -1){
                this.layers[index] = layer;
            }
        })

        this.batchService.batch.subscribe(() => {
            this.actionMessageService.sendInfo('Batch download started');
        });
    }

    onCreateBatch() {

        const layerId = this.form.controls['layer'].value;
        // Get the selected columns for each of the selected source data layers
        const json = this.view.layers.map(layer => {

            const projections = layer.columnIds.map(columnId => {
                const schema = this.layerService.layerStore.get(layer.layerId).schema;
                return Expression.Property('', columnId, LayerDataService.getTypeForField(schema, columnId));
            });

            return {
                insightLayerId: layer.layerId,
                projections: JSON.stringify(projections)
            };
        });

        // Here we wrap up the payload as a json blob and send it to the batch endpoint
        const model: IBatchRequest = {
            jobType: 'insight',
            jsonPayload: JSON.stringify(json),
            batchLayerId: layerId
        };

        this.close.emit(true);
        this.batchService.runBatchJob(model);
    }
}

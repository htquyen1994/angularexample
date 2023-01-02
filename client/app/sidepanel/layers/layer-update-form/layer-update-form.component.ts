import { Component, ViewChild, EventEmitter, AfterContentInit, Output, Inject, Input, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
    LayerService,
    LayerGroupService,
    IErrorResponse
} from '../../../shared';
import {
  DialogComponent,
} from '@client/app/shared/components'
import { ILayer } from '../../../shared/interfaces';
import { decorateError } from '../../../shared/http.util';

@Component({
    selector: 'go-layer-update-form',
    moduleId: module.id,
    templateUrl: 'layer-update-form.component.html',
    styleUrls: ['layer-update-form.component.less']
})
export class LayerUpdateFormComponent implements AfterContentInit {
    @Input('layer') layer: ILayer;
    @ViewChild('dialog', { static: true }) dialog: DialogComponent;
    @Output() close = new EventEmitter<boolean>();

    form: FormGroup;
    error: IErrorResponse;
    isLoading = false;

    constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
        private changeDetectorRef: ChangeDetectorRef,
        public layerGroupService: LayerGroupService,
        private layerService: LayerService) {
    }

    ngAfterContentInit() {
        this.dialog.onHide(false);
        /*
                const group: ILayerGroup = this.layerGroupService.groupStore.find(x => {
                    return !!x.layers.find(layer => layer.id === this.layer.id);
                }) || {};
        */

        this.form = this.formBuilder.group({
            id: [this.layer.id],
            // groupId: [group.id || 0, [Validators.required]],
            name: [this.layer.name, [Validators.required, Validators.maxLength(40)]],
            description: [this.layer.description]
        });
    }

    onClose(state: boolean) {
        this.close.emit(state);
    }

    onComplete() {
        this.isLoading = true;
        const { source, owner } = this.layer;
        this.layerService.updateLayer({...this.form.getRawValue(), source, owner})
            .subscribe(
                response => {
                    const { name, description } = this.form.getRawValue();
                    this.layer.name = name;
                    this.layer.description = description;
                    this.isLoading = false;
                    this.onClose(true);
                },
                error => {
                    this.error = decorateError(error);
                    this.isLoading = false;
                    this.changeDetectorRef.detectChanges();
                });
    }
}

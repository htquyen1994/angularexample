import {Component, ViewChild, EventEmitter, AfterContentInit, Output, Inject, Input, ChangeDetectorRef} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import {
    LayerGroupService,
    LayerService,
    IErrorResponse
} from '@client/app/shared';
import {
  DialogComponent,
} from '@client/app/shared/components';
import { ILayer } from '../../../shared/interfaces';
import { decorateError } from '../../../shared/http.util';

@Component({
    selector: 'go-layer-copy-form',
    moduleId: module.id,
    templateUrl: 'layer-copy-form.component.html',
    styleUrls: ['layer-copy-form.component.less']
})
export class LayerCopyFormComponent implements AfterContentInit {
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
        /*		let group:any = this.layerGroupService.groupStore.find(group => {
         return !!group.layers.find(layer => layer.id === this.layer.id);
         }) || {};*/
        this.form = this.formBuilder.group({
            id: [this.layer.id],
            // groupId: [group.id || 0, [Validators.required]],
            name: [`${this.layer.name} (Copy)`, [Validators.required, Validators.maxLength(40)]]
            // description: [this.layer.description]
        });
    }

    onClose(state: boolean) {
        this.close.emit(state);
    }

    onComplete() {
        this.isLoading = true;
        this.layerService.copyLayer({...this.form.getRawValue(), owner: this.layer.owner, source: this.layer.source}).subscribe(
            response => {
                this.isLoading = false;
                this.onClose(true);
                this.changeDetectorRef.detectChanges();
            },
            error => {
                this.isLoading = false;
                this.error = decorateError(error);
                this.changeDetectorRef.detectChanges();
            });
    }
}

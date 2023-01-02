import {
    Component,
    EventEmitter,
    AfterContentInit,
    ViewChild,
    Output,
    Input,
    ChangeDetectorRef
} from '@angular/core';
import {
    SelectionService,
    LayerDataService,
    IErrorResponse
} from '../../../shared';
import { DialogComponent } from '@client/app/shared/components';
import { ILayer } from '../../../shared/interfaces';
import { decorateError } from '../../../shared/http.util';
import { DocumentFormComponent } from '../document-form/document-form.component';


interface DocumentFile {
    addedBy: string;
    name: string;
    size: string;
    date: string;
    description: string;
    uri: string;
}

@Component({
    selector: 'go-document-form-dialog',
    moduleId: module.id,
    templateUrl: 'document-form-dialog.component.html',
    styleUrls: ['document-form-dialog.component.less']
})
export class DocumentFormDialogComponent implements AfterContentInit {

    @ViewChild('dialog', { static: true }) dialog: DialogComponent;
    @ViewChild('documentForm') documentForm: DocumentFormComponent;
    @Output() close = new EventEmitter<boolean>();
    @Input()
    set layer(layer: ILayer) {
        if (layer) {
            this._layer = Object.assign({}, layer);
        }
    }
    get layer() {
        return this._layer;
    }
    error: IErrorResponse;
    _layer: ILayer;
    files: DocumentFile[] = [];
    submitting: boolean = false;
    private shapeId: string;
    constructor(
        private selectionService: SelectionService,
        private layerDataService: LayerDataService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {
    }

    ngAfterContentInit() {
        this.dialog.onHide(false);
        this.shapeId = this.selectionService.getLayerActiveShapeId(this.layer.id);
        this.updateDocuments();
    }

    onSave(data) {
        this.submitting = true;
        this.error = null;
        this.changeDetectorRef.detectChanges();
        const { file, description } = data;
        this.layerDataService.saveLayerDocument(
            this.layer.id,
            this.shapeId,
            description,
            file
        ).subscribe(
            response => {
                this.submitting = false;
                this.updateDocuments();
                this.documentForm.clearForm();
                this.changeDetectorRef.detectChanges();
            },
            error => {
                this.error = decorateError(error);
                this.changeDetectorRef.detectChanges();
            }, () => {
                this.submitting = false;
                this.changeDetectorRef.detectChanges();
            });
    }

    onDelete(data) {
        const { file } = data;
        this.layerDataService.removeLayerDocument(this.layer.id, this.shapeId, file.name).subscribe((data: any) => {
            if (!data.success) {
                this.error = data.error;
                this.changeDetectorRef.detectChanges();
            } else {
                // rebind document list
                this.updateDocuments();
                this.changeDetectorRef.detectChanges();
            }
        }, error => {
            this.error = decorateError(error);
            this.changeDetectorRef.detectChanges();
        });
    }

    updateDocuments() {
        this.layerDataService.getLayerDocuments(this.layer.id, this.shapeId).subscribe((data: any) => {
            this.files = data.results;
            this.changeDetectorRef.detectChanges();
        });
    }

    onClose(state: boolean) {
        this.close.emit(state);
    }

    closeForm() {
        this.close.emit(true);
    }
}

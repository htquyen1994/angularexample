import {AfterContentInit, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormGroup} from '@angular/forms';
import { IErrorResponse, LayerService } from '@client/app/shared';
import { DialogComponent } from '@client/app/shared/components';
import { ILayer } from '@client/app/shared/interfaces';
import { decorateError } from '@client/app/shared/http.util';

@Component({
  selector: 'go-layer-delete-form',
  moduleId: module.id,
  templateUrl: 'layer-delete-form.component.html',
  styleUrls: ['layer-delete-form.component.less']
})
export class LayerDeleteFormComponent implements AfterContentInit {
  @Input() set layer(layer: ILayer) {
    this.activeLayer = layer;
    this.isLayerOwner = layer ? layer.source === 2 : false;
  }

  @ViewChild('dialog', { static: true }) dialog: DialogComponent;
  @Output() close = new EventEmitter<boolean>();

  form: FormGroup;
  error: IErrorResponse;
  isLoading = false;
  activeLayer: ILayer;

  sharedCount = 0;
  isLayerOwner = false;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private layerService: LayerService) {
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
    this.layerService.getLayerSharedUserList(this.activeLayer.owner, this.activeLayer.id, this.activeLayer.source).subscribe(data => {
      this.sharedCount = data.length;
      this.changeDetectorRef.detectChanges();
    });
  }

  onClose(state: boolean) {
    this.close.emit(state);
  }

  onComplete() {
    this.isLoading = true;
    const { id, source, owner } = this.activeLayer;
    this.layerService.deleteLayerServer({dataPackageId: id, source, owner}).subscribe(
      response => {
        this.isLoading = false;
        this.layerService.setActiveChange(null);
        this.onClose(true);
      },
      error => {
        this.error = decorateError(error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
  }
}

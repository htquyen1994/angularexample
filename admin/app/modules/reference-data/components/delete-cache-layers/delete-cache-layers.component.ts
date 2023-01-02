import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ReferenceDataService } from '@admin-modules/reference-data/services';
import { ActionMessageService } from '@admin-core/services/action-message.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { range } from '@admin-shared/models/global';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';
import { ConfirmDialogModel, ConfirmDialogComponent } from '@admin-shared/components/confirm-dialog/confirm-dialog.component';
import { decorateError } from '@admin-shared/models/error';
import { ICacheDelete } from '@admin-modules/reference-data/models';

@Component({
  selector: 'ps-delete-cache-layers',
  templateUrl: './delete-cache-layers.component.html',
  styleUrls: ['./delete-cache-layers.component.less']
})
export class DeleteCacheLayersComponent implements OnInit {
  form: FormGroup;
  loading$ = new BehaviorSubject<boolean>(false);
  zoomLevels: IDropdownItem[] = [];
  zoomLevels_clustered: IDropdownItem[] = [];
  selectedLayers: {
    minZoomLevel: number,
    maxZoomLevel: number,
    minClusteredZoomLevel: number,
    maxClusteredZoomLevel: number,
    connectionString: string,
    dataPackageId: string
  }[] = []
  constructor(private fb: FormBuilder,
    private referenceDataService: ReferenceDataService,
    private cd: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
    public dialogRef: MatDialogRef<DeleteCacheLayersComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    const { layers } = data;
    this.selectedLayers = layers.map((layer: { minZoomLevel, maxZoomLevel, connectionString, maxClusteredZoomLevel, minClusteredZoomLevel, dataPackageId, datasetName }) => ({
      minZoomLevel: layer.minZoomLevel ? layer.minZoomLevel : 5,
      maxZoomLevel: layer.maxZoomLevel ? layer.maxZoomLevel : 19,
      minClusteredZoomLevel: layer.minClusteredZoomLevel ? layer.minClusteredZoomLevel : 5,
      maxClusteredZoomLevel: layer.maxClusteredZoomLevel ? layer.maxClusteredZoomLevel : 19,
      connectionString: layer.connectionString,
      dataPackageId: layer.dataPackageId
    }))
    const { minZoomLevel, maxZoomLevel } = this.selectedLayers.map(e => ({ minZoomLevel: e.minZoomLevel, maxZoomLevel: e.maxZoomLevel })).reduce((a, b) => {
      return {
        minZoomLevel: a.minZoomLevel > b.minZoomLevel ? b.minZoomLevel : a.minZoomLevel,
        maxZoomLevel: a.maxZoomLevel > b.maxZoomLevel ? a.maxZoomLevel : b.maxZoomLevel,
      }
    });
    const { minClusteredZoomLevel, maxClusteredZoomLevel } = this.selectedLayers.map(e => ({ minClusteredZoomLevel: e.minClusteredZoomLevel, maxClusteredZoomLevel: e.maxClusteredZoomLevel })).reduce((a, b) => {
      return {
        minClusteredZoomLevel: a.minClusteredZoomLevel > b.minClusteredZoomLevel ? b.minClusteredZoomLevel : a.minClusteredZoomLevel,
        maxClusteredZoomLevel: a.maxClusteredZoomLevel > b.maxClusteredZoomLevel ? a.maxClusteredZoomLevel : b.maxClusteredZoomLevel,
      }
    });
    this.zoomLevels = range(minZoomLevel, maxZoomLevel).map(e => { return { id: e, name: e } as IDropdownItem });
    this.zoomLevels_clustered = range(minClusteredZoomLevel, maxClusteredZoomLevel).map(e => { return { id: e, name: e } as IDropdownItem });
    this.form = this.fb.group({
      zoomLevel: [this.zoomLevels.map(e => e.id)],
      zoomLevel_clustered: [this.zoomLevels_clustered.map(e => e.id)],
    });
    this.form.setValidators((group: FormGroup) => {
      const value = group.getRawValue();
      const { zoomLevel, zoomLevel_clustered } = value;
      return (zoomLevel && zoomLevel.length > 0) || (zoomLevel_clustered && zoomLevel_clustered.length > 0) ? null : {
        required: true
      };
    })
  }

  ngOnInit() {
  }

  onSubmit() {
    const { zoomLevel, zoomLevel_clustered } = this.form.getRawValue();
    const models: ICacheDelete[] = this.selectedLayers.map(e => ({
      dataPackageId: e.dataPackageId,
      zoomLevel,
      zoomLevel_clustered,
      connectionStringName: e.connectionString
    }))
    this.confirmDialog(models);
  }

  onCancel() {
    this.dialogRef.close();
  }
  confirmDialog(models: ICacheDelete[]): void {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Action", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.loading$.next(true);
        forkJoin(models.map(model => this.deleteCache(model)))
          .subscribe(e => {
            this.actionMessageService.sendSuccess("Selected layers cache has been cleared");
            for(const deleteResponse of e){
              this.actionMessageService.sendSuccess("Layer "+ deleteResponse.layerId + " deleted key count: " + deleteResponse.deletedKeysCount);
            }

            this.loading$.next(false);
          }, err => {
            this.actionMessageService.sendError(decorateError(err).error.message);
            this.loading$.next(false);
          })
      }
    });
  }

  deleteCache(model: ICacheDelete) {
    return this.referenceDataService.deleteDataPackageCache(model);
  }
}

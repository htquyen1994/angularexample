import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  selector: 'ps-delete-cache',
  templateUrl: './delete-cache.component.html',
  styleUrls: ['./delete-cache.component.less']
})
export class DeleteCacheComponent implements OnInit {
  form: FormGroup;
  loading$ = new BehaviorSubject<boolean>(false);
  zoomLevels: IDropdownItem[] = [];
  zoomLevels_clustered: IDropdownItem[] = [];
  name: string;
  constructor(private fb: FormBuilder,
    private referenceDataService: ReferenceDataService,
    private cd: ChangeDetectorRef,
    private actionMessageService: ActionMessageService,
    public dialogRef: MatDialogRef<DeleteCacheComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    const { minZoomLevel, maxZoomLevel, connectionString, maxClusteredZoomLevel, minClusteredZoomLevel, dataPackageId, datasetName } = data;
    if (minZoomLevel != null || maxZoomLevel != null) {
      this.zoomLevels = range(minZoomLevel ? minZoomLevel : 5, maxZoomLevel ? maxZoomLevel : 19).map(e=>{return{id: e, name: `${e}`} as IDropdownItem});
    }
    if (minClusteredZoomLevel != null || maxClusteredZoomLevel != null) {
      this.zoomLevels_clustered = range(minClusteredZoomLevel ? minClusteredZoomLevel : 5, maxClusteredZoomLevel ? maxClusteredZoomLevel : 19).map(e=>{return{id: e, name: `${e}`} as IDropdownItem});
    }
    this.name = datasetName;
    this.form = this.fb.group({
      dataPackageId: [dataPackageId, Validators.required],
      zoomLevel: [this.zoomLevels.map(e=>e.id)],
      zoomLevel_clustered: [this.zoomLevels_clustered.map(e=>e.id)],
      connectionStringName: [connectionString, Validators.required]
    });
    this.form.setValidators((group: FormGroup) => {
      const value = group.getRawValue();
      const { zoomLevel, zoomLevel_clustered} = value;
      return (zoomLevel && zoomLevel.length > 0) || (zoomLevel_clustered && zoomLevel_clustered.length > 0) ? null : {
        required: true
      };
    })
  }

  ngOnInit() {
  }

  onSubmit() {
    const {dataPackageId, zoomLevel, zoomLevel_clustered, connectionStringName} = this.form.getRawValue();
    const model: ICacheDelete = {
      dataPackageId,
      zoomLevel,
      zoomLevel_clustered,
      connectionStringName
    }
    this.confirmDialog(model);
  }

  onCancel() {
    this.dialogRef.close();
  }
  confirmDialog(model: ICacheDelete): void {
    const message = `Are you sure you want to do this?`;
    const dialogData = new ConfirmDialogModel("Confirm Action", message);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if(dialogResult){
        this.loading$.next(true);
        this.deleteCache(model).subscribe(e=>{
          this.actionMessageService.sendSuccess("Cache has been cleared. Delete keys count: " + e.deletedKeysCount);
          this.loading$.next(false);
        },err=>{
          this.actionMessageService.sendError(decorateError(err).error.message);
          this.loading$.next(false);
        })
      }
    });
  }

  deleteCache(model: ICacheDelete){
    return this.referenceDataService.deleteDataPackageCache(model);
  }
}

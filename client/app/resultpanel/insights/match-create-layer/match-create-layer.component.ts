import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ChangeDetectorRef, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CreateMatchLayerMethod } from '../../shared/models/match-it.model';
import { LayerGroupService } from '../../../shared/layer-group.service';
import { DialogComponent } from '@client/app/shared/components';
import { MatchItService } from '../../shared/services/match-it.service';
import { Subscription, of } from 'rxjs';
import { decorateError } from '../../../shared/http.util';
import { mergeMap, switchMap } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LayerService, LayerStyle, LayerStyleService } from '../../../shared';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'go-match-create-layer',
  templateUrl: './match-create-layer.component.html',
  styleUrls: ['./match-create-layer.component.less']
})
export class MatchCreateLayerComponent implements OnInit {
  @ViewChild('saveMatchDialog', { static: true })
  public saveMatchDialog: DialogComponent;

  public layerStyle: LayerStyle;
  public saveMatchForm: FormGroup = new FormGroup({
    layerName: new FormControl(null, [Validators.required, Validators.maxLength(40)]),
    createMethod: new FormControl(CreateMatchLayerMethod.newlayer, [Validators.required]),
    groupId: new FormControl(null, [Validators.required]),
    description: new FormControl(null)
  });
  public saveMatchFormError: any;
  public matchFormLoading: boolean = false;
  public createFilterAsLayer: any = null;
  public title = 'Title';
  public isLoadingMatchIt = false;
  groupOptions: PsSelectOption[] = [];
  get groupId() {
    return this.saveMatchForm.get('groupId');
  }
  public get description() {
    return this.saveMatchForm.get('description');
  }

  private matchRequestSubscription: Subscription;

  constructor(private layerGroupService: LayerGroupService,
    private layerService: LayerService,
    private matchItService: MatchItService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<MatchCreateLayerComponent>,
    private layerStyleService: LayerStyleService) {
  }

  public ngOnInit() {
    this.groupOptions = Array.from(this.layerGroupService.groupStore).map((e, i) => !e.isLocked ? ({ label: e.name, value: i }): null).filter(e=>!!e);
    this.createFilterAsLayer = this.data['createFilterAsLayer'];
    if (this.createFilterAsLayer) {
      this.title = 'Create Layer from Filter';
    } else {
      this.title = this.data['title'] ? this.data['title'] : 'Save Match'
    }
    this.layerStyle = this.data['layerStyle'];
    if (this.saveMatchForm.get('groupId')) {
      this.saveMatchForm.patchValue({
        groupId: this.layerGroupService.groupStore.findIndex(g => !g.isLocked && g.name === "My Layers")
      })
    }
  }

  public ngAfterContentInit() {
    this.saveMatchDialog.onHide(false);
  }

  public onDialogClose(data?) {
    this.saveMatchFormError = null;
    this.createFilterAsLayer = null;
    this.unsubscribeMatchRequest(true);
    this.dialogRef.close(data);
  }

  public onCreateMatchLayer() {
    this.matchFormLoading = true;
    const formValue = this.saveMatchForm.getRawValue();
    const reviewData = this.data['reviewData'];
    const model = {
      ...formValue,
      ...reviewData,
      createMethod: CreateMatchLayerMethod[formValue['createMethod']]
    }
    this.unsubscribeMatchRequest();
    this.matchRequestSubscription = this.matchItService.createMatchLayer(model, this.createFilterAsLayer).pipe(mergeMap(res => {
      if (res.file) {
        return this.matchItService.downLoadFile(res.file);
      }
      if (this.layerStyle) {
        const { dataPackageId } = res;
        return this.layerStyleService.addStyleObs(dataPackageId, this.layerStyle, this.layerStyle).pipe(
          switchMap(_ => this.layerService.notifyLayerAvailable(res)))
      } else {
        return this.layerService.notifyLayerAvailable(res);
      }
    })).subscribe(res => {
      this.matchFormLoading = false;
      this.saveMatchFormError = null;
      this.newSaveMatchForm();
      this.saveMatchDialog.onHide(true);
      this.changeDetectorRef.detectChanges();
    }, err => {
      this.saveMatchFormError = decorateError(err);
      this.matchFormLoading = false;
      this.changeDetectorRef.detectChanges();
    })
  }

  public unsubscribeMatchRequest(turnLoadingOff?) {
    if (this.matchRequestSubscription) this.matchRequestSubscription.unsubscribe();
    if (turnLoadingOff) {
      this.matchFormLoading = false;
      this.setLoadingMatchIt(false);
    }
  }

  public newSaveMatchForm() {
    if (this.saveMatchForm) {
      this.saveMatchForm.patchValue({
        layerName: null
      });
    }
    this.changeDetectorRef.detectChanges();
  }

  public setLoadingMatchIt(value) {
    this.isLoadingMatchIt = value;
    this.changeDetectorRef.detectChanges();
  }
}

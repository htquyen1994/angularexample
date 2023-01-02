import { IAccount } from './shared/interfaces/account-interfaces';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, NgZone } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { detect } from 'detect-browser';
import { debounceTime, first, filter, map } from 'rxjs/operators';
import { DrawingService } from './map/services/drawing.service';
import { StreetviewService } from './resultpanel/streetview/streetview.service';
import { IDataPackage } from './shared/Data/Packaging';
import { environment } from '../environments/environment';

import {
  AccountService,
  ActionMessageService,
  convertToILayer,
  FilterService,
  HttpService,
  HubService,
  InsightService,
  LayerGroupService,
  LayerService,
  LayerSource,
  LayerStyleService,
  LocationService,
  MapService,
  OverlayService,
  PanelService,
  SelectionService,
  SettingsService,
  TileOverlayAbstract,
  WorkerService,
  AppInsightsService,
  COLORS,
  calculateVH,
  IS_POSTOFFICE,
} from './shared';
import { addIconstoICONS, ICONS_CURZON } from './shared/models/overlayShapeIcon'
import { IStartUpSettings, IHubMessage } from './shared/interfaces';
import { ModalService } from './shared/services/modal.service';
import { ModalModel } from './shared/models/modal.model';
import { transition, animate, state, style, trigger } from '@angular/animations';
import { decorateError } from './shared/http.util';
import { forkJoin, Subject, zip, Observable } from 'rxjs';
import { ColumnManageService } from './resultpanel/shared/services/column-manage.service';
import { BreakpointService } from './shared/services/breakpoint.service';
import { LabelService } from './shared/services/label.service';
import { SystemBreakdownService } from './shared/services/system-breakdown.service';
import { ServerDownDialogComponent } from './shared/containers';
import { OVERLAY_TYPE } from './shared/enums';
import { ViewManagementStoreService } from '@client/app/core/modules';
import { ResultPanelStoreService } from './resultpanel/services';
import { PanelStoreService, LayerStoreService } from './core/services';
import { ResultPanelCollapseState } from './core/enums';
@Component({
  selector: 'go-app',
  moduleId: module.id,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.less'],
  animations: [
    trigger('messageAreaState', [
      state(
        '0',
        style({
          bottom: 0
        })
      ),
      state(
        '1',
        style({
          bottom: '50vh'
        })
      ),
      state(
        '2',
        style({
          bottom: '100vh'
        })
      ),
      transition('* <=> *', animate(200))
    ])
  ],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  @ViewChild('drawerRight', { static: true }) drawerRight: ElementRef;
  startupSettings: IStartUpSettings;
  sidepanelState = true;

  currentUser = "";
  deleteModel: ModalModel;
  modalKey: string;
  sidePanelChanged$ = new Subject<boolean>();
  resultPanelState$: Observable<ResultPanelCollapseState>;
  ResultPanelCollapseState = ResultPanelCollapseState;
  constructor(private mapService: MapService,
    private overlayService: OverlayService,
    private layerService: LayerService,
    private filterService: FilterService,
    private locationService: LocationService,
    private panelService: PanelService,
    private hubService: HubService,
    private streetviewService: StreetviewService,
    private accountService: AccountService,
    private insightService: InsightService,
    private httpService: HttpService,
    private layerGroupService: LayerGroupService,
    private layerStyleService: LayerStyleService,
    private selectionService: SelectionService,
    private drawingService: DrawingService,
    private actionMessageService: ActionMessageService,
    private settingsService: SettingsService,
    private changeDetectorRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private workerService: WorkerService,
    private applicationInsightsService: AppInsightsService,
    private matIconRegistry: MatIconRegistry,
    private columnManageService: ColumnManageService,
    private breakPointService: BreakpointService,
    private ngZone: NgZone,
    private labelService: LabelService,
    private systemBreakdownService: SystemBreakdownService,
    private modalService: ModalService,
    private _viewManagementStoreService: ViewManagementStoreService,
    private _ngZone: NgZone,
    private _resultPanelStoreService: ResultPanelStoreService,
    private _panelStoreServices: PanelStoreService,
    private _layerStoreService: LayerStoreService,
  ) {
  }

  ngOnInit() {
    this.resultPanelState$ = this._panelStoreServices.resultPanelState$;
    const layerSubject = this.layerService.getDataPackageList();
    const groupSubject = this.layerGroupService.getGroupList();
    const locationSource = this.locationService.getLocationList();
    const filterSubject = this.filterService.getFilterList();
    const insightSubject = this.insightService.getList();

    this.matIconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('/assets/iconset.svg'));
    this.matIconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('/assets/google_iconset.svg'));

    this.accountService.account.subscribe((item: IAccount) => {
      this.currentUser = item.username;
      const { drawShapeFillColour, drawShapeOpacity, drawShapeStrokeColour } = item;
      const cloneColor = {...COLORS};
      if (drawShapeFillColour) COLORS.MAP_CREATION = drawShapeFillColour;
      if (drawShapeStrokeColour) COLORS.MAP_CREATION_STROKE = drawShapeStrokeColour;
      if (drawShapeOpacity != null && drawShapeOpacity != undefined) COLORS.MAP_CREATION_TRANSPARENCY = drawShapeOpacity;
      if(cloneColor.MAP_CREATION != drawShapeFillColour
        || cloneColor.MAP_CREATION_STROKE != drawShapeStrokeColour
        || cloneColor.MAP_CREATION_TRANSPARENCY != drawShapeOpacity){
          this.drawingService.resetDrawingOption();
        }
    });
    this._viewManagementStoreService.getInsightViews();
    if(IS_POSTOFFICE){
      COLORS.MAP_EDIT_POINT = 'rgba(255, 0, 0, 0)'
    }
    this.accountService.account.pipe(first()).subscribe((item: IAccount) => {
        addIconstoICONS(ICONS_CURZON);
        this._resultPanelStoreService.getTabs();
    });
    this.workerService.workerNewInnit(()=>{
      this.workerService.configWorker();
    })
    this.hubService.hub.subscribe((message: IHubMessage) => {

      switch (message.component) {
        case 'layer':

          // TODO change action to operation for layer redraw
          if (message.content.action) {
            message.content.operation = <any>message.content.action; // === 'redraw';
          }

          switch (message.content.operation) {
            case 'redraw2':


              message.content.layerIds.forEach((layerId: string) => {

                if (this.overlayService.overlays.has(layerId)) {
                  this.overlayService.invalidateAndUpdate(
                    <TileOverlayAbstract<any>>this.overlayService.overlays.get(layerId),
                    message.content['invalidatedCacheRegions']);
                }

                if (this.layerService.layerActiveStore && this.layerService.layerActiveStore.id === layerId) {
                  // this.layerService.layerActiveSource.next(this.layerService.layerActiveStore);
                  this.layerService.layerUpdated$.next({
                    layer: this.layerService.layerActiveStore,
                    user: message.content['user'],
                    updatedShapeIds: message.content['invalidatedCacheRegions']['FeatureIds']
                  });
                }
              });
              break;


            case 'redraw':
              if (this.overlayService.overlays.has(message.content.layerId)) {
                this.overlayService.invalidateAndUpdate(
                  <TileOverlayAbstract<any>>this.overlayService.overlays.get(message.content.layerId),
                  message.content['invalidatedCacheRegions']);
              }

              if (this.layerService.layerActiveStore && this.layerService.layerActiveStore.id === message.content.layerId) {
                // this.layerService.layerActiveSource.next(this.layerService.layerActiveStore);
                this.layerService.layerUpdated$.next({
                  layer: this.layerService.layerActiveStore,
                  user: message.content['user'],
                  updatedShapeIds: message.content['invalidatedCacheRegions']['FeatureIds']
                });
              }
              break;

            // This is the only event that we respond to in order to update the layer group with a newly added layer
            // If it is necessary to update the group, use this event rather than adding it to
            case 'ShareLayerSuccess':
              if (this.currentUser.toLowerCase() !== message.content.ownerId) {
              const { userid, dataPackageId} = message.content;
                const userIds = (<string>userid).split('|');
                if(!userIds.includes(this.currentUser.toLowerCase())){
                  break;
                }
                const isExisted = !!this.layerService.getLayer(dataPackageId);
                if(isExisted){
                  break;
                }
                this.httpService.get(`DataPackageIndex/Dump/`).subscribe((data: IDataPackage[]) => {
                  const presentLayer = data.find(_ => _.Id === message.content.dataPackageId);
                  if (presentLayer) {
                    const newLayer = convertToILayer(presentLayer, this.currentUser.toLowerCase());
                    this.actionMessageService.sendInfo(`Layer '${newLayer.name}' has been shared with you`);
                    this.layerService.addLayer(newLayer);
                    const groupId = this.layerGroupService.groupStore.findIndex(group => group.type === LayerSource.USER)
                    this.layerGroupService.groupAddSource.next({
                      groupId,
                      layer: newLayer
                    });
                    this.changeDetectorRef.detectChanges();
                  }
                });
              }
              break;

            case 'ShareFilterSuccess': {
              if (this.currentUser.toLowerCase() === message.content.ownerId) {
                break;
              }
              const { userid, dataPackageId } = message.content;

              if (userid != this.currentUser.toLowerCase()) {
                break;
              }
              const layer = this.layerService.layerStore.get(dataPackageId)
              if(!layer) {
                break;
              }
              this.actionMessageService.sendInfo(`A filter for layer ${layer.name} has just been shared with you`);
              this.filterService.getUserFiltersByLayerId(dataPackageId).subscribe(filters => {
                this.filterService.addFiltersByLayerId(dataPackageId, filters);
              });
              this.changeDetectorRef.detectChanges();
              break;
            }
            case 'ShareStyleSuccess': {
              if (this.currentUser.toLowerCase() === message.content.ownerId) {
                break;
              }
              const { userid, dataPackageId } = message.content;

              if (userid != this.currentUser.toLowerCase()) {
                break;
              }

              const layer = this.layerService.layerStore.get(dataPackageId)
              if(!layer) {
                break;
              }

              this.actionMessageService.sendInfo(`A style for layer ${layer.name} has just been shared with you`);
              // handling
              this.layerStyleService.getUserStyles(dataPackageId).subscribe(styles => {
                this.layerStyleService.addOrUpdateStylesByLayerId(dataPackageId, styles, false)
              })
              this.changeDetectorRef.detectChanges();
              break;
            }
            case 'ShareInsightSuccess': {
              if (this.currentUser.toLowerCase() === message.content.ownerId) {
                break;
              }
              const { userid, dataPackageId } = message.content;

              if (userid != this.currentUser.toLowerCase()) {
                break;
              }
              this.actionMessageService.sendInfo(`An insight view has just been shared with you`);
               // handling
               this._viewManagementStoreService.getInsightViews();
              this.changeDetectorRef.detectChanges();
              break;
            }
            case 'LayerAvailableSuccess':
              this.httpService.get(`DataPackageIndex/Dump/`).subscribe((data: IDataPackage[]) => {
                const presentLayer = data.find(_ => _.Id === message.content.dataPackageId);
                if (presentLayer) {
                  this.actionMessageService.sendInfo('New layer created');
                  const newLayer = convertToILayer(presentLayer, this.currentUser.toLowerCase());
                  this.layerService.addLayer(newLayer);
                  this.layerGroupService.groupAddSource.next({
                    groupId: Number(message.content['layerGroupId']),
                    layer: newLayer
                  });
                  this.changeDetectorRef.detectChanges();
                }
              });
              break;

            case 'UpdateLayerSuccess':
              this.httpService.get(`DataPackageIndex/Dump/`).subscribe((data: IDataPackage[]) => {
                const presentLayer = data.find(_ => _.Id === message.content.dataPackageId);
                if (presentLayer) {
                  const newLayer = convertToILayer(presentLayer, this.currentUser.toLowerCase());
                  const layerObject = this.layerService.layerStore.get(newLayer.id);
                  layerObject.name = newLayer.name;
                  layerObject.description = newLayer.description;
                  this.changeDetectorRef.detectChanges();
                }
              });
              break;
            case 'UnshareLayerSuccess':
              const { userid, dataPackageId} = message.content;
              const userIds = (<string>userid).split('|');
              if(!userIds.includes(this.currentUser.toLowerCase())){
                break;
              }
              const deleteLayer = this.layerService.layerStore.get(dataPackageId);
              if (deleteLayer && this.currentUser.toLowerCase() !== message.content.ownerId) {
                this.actionMessageService.sendInfo(`Layer '${deleteLayer.name}' unshared with you`);
                this.selectionService.clearLayerSelections(deleteLayer.id);
                this.layerService.deleteLayer(deleteLayer);
                this.changeDetectorRef.detectChanges();
              }
              break;
            case 'LayerDeletionSuccess':
              const layer = this.layerService.layerStore.get(message.content.dataPackageId);
              if (layer) {
                this.selectionService.clearLayerSelections(layer.id);
                this.layerService.deleteLayer(layer);
                this.actionMessageService.sendInfo('Layer Deleted');
                this.changeDetectorRef.detectChanges();
              }
              break;
            case 'EditColumnsSuccess':
              forkJoin(
                this.layerService.refreshLayer(message.content.dataPackageId, this.currentUser.toLowerCase()),
                this.filterService.getFilterList().pipe(first())
              ).subscribe(([layer, filters]) => {
                this.columnManageService.updateSuccess();
                this.filterService.getFilterListData(filters, () => {
                  if (this.layerService.layerActiveStore && this.layerService.layerActiveStore.id == layer.id) {
                    this.layerService.setActiveChange(layer);
                  }
                }, false);
                this.changeDetectorRef.detectChanges();
              }, err => {
                this.actionMessageService.sendError(decorateError(err).error.message);
              })
              break;
            case 'CalculateColumnSuccess':
              const _layer = this.layerService.layerStore.get(message.content.dataPackageId);
              if (_layer) {
                if (this.layerService.layerActiveStore && this.layerService.layerActiveStore.id == _layer.id) {
                  this.layerService.setActiveChange(_layer);
                  if (this.overlayService.overlays.get(_layer.id)) {
                    this.overlayService.invalidateAll(
                      <TileOverlayAbstract<any>>this.overlayService.overlays.get(_layer.id));
                  }
                }
              }
              break;
            case 'LayerGroupSuccess': // move
              break;

            default:
              console.warn('operation not defined', (<any>message.content).operation);
          }

          break;
        default:
          console.warn('component not defined', message.component);
      }
    });

    this.settingsService.startupSettings.subscribe((item) => {
      this.startupSettings = item;
      const id = item.resultPanelState === null ? 1 : item.resultPanelState;
      this._panelStoreServices.setResultPanelState(id);
      this.panelService.setSidePanel(item.sidePanelState === null ? true : item.sidePanelState);
    });
    this.panelService.sidePanel.subscribe(state => {
      this.sidepanelState = state;
      this.changeDetectorRef.detectChanges();
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          const rect = this.drawerRight.nativeElement.getBoundingClientRect()
          this.breakPointService.changeRightSection({ height: rect.height, width: rect.width });
          this.sidePanelChanged$.next(state);
        }, 200); //because animation
      })
    });

    Object.keys(OVERLAY_TYPE).forEach((key)=>{
      this.overlayService.createOverlay(OVERLAY_TYPE[key]);
    })

    this.settingsService.getStartSettings();

    const styleSource = zip(
      this.layerStyleService.getStyleList(),
      this.layerStyleService.getUserStyles()
    ).pipe(map(([styles, _style])=> ([...styles, _style])));
    const labelStyle = this.labelService.innit();

    this.mapService.mapRx.pipe(first()).subscribe(() => {
      if (environment.production === false) {
        console.log('map loaded');
      }
      forkJoin(
        layerSubject,
        labelStyle,
        this.accountService.account.pipe(filter(e => !!e), first())
      ).subscribe(([datapackageList, style, account]) => {
        const layers = this.layerService.convertDatapackageListToILayers(datapackageList, account.username.toLowerCase());
        this.layerService.setLayers(layers);
        this.labelService.removeRedundantStyles(layers);
      })
      this.layerStyleService.getColourRamps();

      this.layerService.layer.pipe(debounceTime(200)).subscribe(layers => {
        this._ngZone.run(()=>{
          this._viewManagementStoreService.getInsightLayers();
          this._layerStoreService.getLayers();
          filterSubject.subscribe(filters => {
            this.filterService.getFilterListData(filters);
            this._layerStoreService.getFilters()
          });

          styleSource.subscribe(styles => {
            this.layerStyleService.getStyleListData(styles);
          });

          insightSubject.subscribe(insights => {
            this.insightService.setStore(insights);
          });

          groupSubject.subscribe(groups => {
            this.layerGroupService.groupsSource.next(
              this.layerGroupService.convertToILayerGroup(groups, this.layerService.layerStore));
          });
        })
      });
    });

    locationSource.subscribe(locations => {
      this.locationService.getLocationListData(locations);
    });

    const browser = detect();
    switch (browser && browser.name) {
      case 'chrome':
      case 'firefox':
        break;
      case 'edge':
        this.actionMessageService.sendInfo('It looks like you are using a partially supported browser "' + browser.name + '". To get the best experience with Periscope you should use Google Chrome.');
        break;

      default:
        this.actionMessageService.sendWarning('It looks like you are using an unsupported browser "' + browser.name + '". To get the best experience with Periscope you should use Google Chrome.');
    }
    this.breakPointService.change$.subscribe(value => {
      const rect = this.drawerRight.nativeElement.getBoundingClientRect()
      this.breakPointService.changeRightSection({ height: rect.height, width: rect.width });
    })
    window.addEventListener('resize', () => {
      // We execute the same script as before
      this.calculateVH();
    });
    this.hubService.connecting$.pipe(filter(e=>!e)).subscribe(()=>{
      if(!this.systemBreakdownService.isServerDown){
        this.systemBreakdownService.checkServer();
      }
    })
    this.systemBreakdownService.serverDown$.pipe(filter(e=>e), first()).subscribe((value)=>{
      if(value){
        this.openServerBreakdownDialog();
        this.systemBreakdownService.serverDown$.pipe(filter(e=>!e), first()).subscribe(()=>{
          this.systemBreakdownService.reloadBrowser();
        })
      }
    })
  }
  calculateVH(){
    calculateVH();
  }
  openServerBreakdownDialog() {
    const ref = this.modalService.openModal(ServerDownDialogComponent,null, {hasBackdrop: true, disableClose: true})
    ref.afterClosed().pipe(first()).subscribe(res => {
      if (res) {
        if (res.error) {
          this.actionMessageService.sendError(res.error.message);
        }
        if (res.success) {
          this.actionMessageService.sendInfo('Edit success');
        }
      }
      this.changeDetectorRef.detectChanges();
    })
    this.changeDetectorRef.detectChanges();
  }
}

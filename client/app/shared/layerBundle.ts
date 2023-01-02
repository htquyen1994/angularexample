import { ILayer, ILayerColumn, ILayerColumnGroup } from './interfaces/layer-interfaces';
import { BehaviorSubject, Observable } from 'rxjs';
import { generateLayerIndicatorSVG, generateLayerIndicatorSVGLine } from './global';

export class LayerBundle implements ILayer {
  private _childLayers: ILayer[];
  private _activeChild: ILayer;
  private activeChildChangeSource: BehaviorSubject<ILayer>
  private _activeIndex: number = 0
  icon: any;
  activeChildChange$: Observable<ILayer>;
  bundleId:string;
  constructor(childLayers: ILayer[]) {
    this._childLayers = childLayers.sort((a, b) => a.minZoom - b.minZoom);
    this._activeChild = this._childLayers[this._activeIndex];
    this.activeChildChangeSource = new BehaviorSubject<ILayer>(this._activeChild);
    this.activeChildChange$ = this.activeChildChangeSource.asObservable();
    this.setIcon();
    this.groupId = this._activeChild.groupId;
    this.bundleId = this._activeChild.bundleId;
  }

  setActivateChildForZoom(zoomLevel: number) {
    const { id, isActive, isSelected, isDisabled } = this._activeChild;
    const index = this._childLayers.findIndex(a => { return (a.minZoom <= zoomLevel) && (a.maxZoom >= zoomLevel); }); //todo logic for clustering / heatmaps
    if(index != -1){
      this._activeIndex = index;
      this._activeChild = this._childLayers[this._activeIndex];
      if (this._activeChild.id != id) {
        this.activeChildChangeSource.next(this._activeChild);
        this.setIcon();
      }
    }
    return this._activeChild;
    //also probably needs logic to remove any handlers as old child layer goes out of scope
  }

  setIcon(){
    this.icon = generateLayerIndicatorSVGLine(this._activeIndex + 1, this._childLayers.length);
  }
  get childLayers() { return this._childLayers; }
  get activeChild() { return this._activeChild; }
  get minZoom() { return this._activeChild.minZoom; };
  get maxZoom() { return this._activeChild.maxZoom; };
  get minClusteredZoom() { return this._activeChild.minClusteredZoom; };
  get maxClusteredZoom() { return this._activeChild.maxClusteredZoom; };
  get minHeatmapZoom() { return this._activeChild.minHeatmapZoom; };
  get maxHeatmapZoom() { return this._activeChild.maxHeatmapZoom; };
  get isEditable() { return false; };
  get isDownloadable() { return this._activeChild.isDownloadable; };
  get isRestrictedDownloadable() { return this._activeChild.isRestrictedDownloadable; };
  get hasInfo() { return this._activeChild.hasInfo; };
  get showGroupHeaders() { return this._activeChild.showGroupHeaders; };
  defaultDisplay?: boolean;
  defaultActive?: boolean;
  hasInsight?: boolean;
  get isActive() { return this._activeChild.isActive };
  get heatMapOnly() { return this._activeChild.heatMapOnly; };
  get isInsightActive() { return this._activeChild.isInsightActive; };
  get isDisabled() { return this._activeChild.isDisabled; };
  get isSelected() { return this._activeChild.isSelected; };
  get isCollapsed() { return this._activeChild.isCollapsed; };
  get selectedRecords() { return this._activeChild.selectedRecords; };
  groupId?: number;
  get dataCache() { return this._activeChild.dataCache; };
  get schema() { return this._activeChild.schema; };
  get id() { return this._activeChild.id; };
  get type() { return this._activeChild.type; };
  get owner() { return this._activeChild.owner; };
  get joinType() { return this._activeChild.joinType; };
  get joinLayerType() { return this._activeChild.joinLayerType; };
  get source() { return this._activeChild.source; };
  get name() { return this._activeChild.name; };
  get apiKey() { return this._activeChild.apiKey; };
  get description() { return this._activeChild.description; };
  get columns(): ILayerColumn[] { return this._activeChild.columns };
  get columnGroups(): ILayerColumnGroup[] { return this._activeChild.columnGroups };
  get clippingGeometryNames() : string[] {return this._activeChild.clippingGeometryNames;}

  setAttr(attr: string, value: any) {
    for (let index = 0; index < this._childLayers.length; index++) {
      this._childLayers[index][attr] = value
    }
  }
}

import { ResultResponse } from '../messages/resultResponse';
import { ViewportProcess } from './viewportProcess';
import { WorkerBase } from '../../workerBase';
import { WWMessage } from '../messages/message';
import { ViewportTilesRequestPayload } from '../payloads/ViewportTilesRequestPayload';
import { LayerType } from '../../../client/app/shared/enums/layer-enums';

export class ViewportTilesProcess extends ViewportProcess {
  checkComplete: Function;

  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker, initialMessage);
    const { layer } = <ViewportTilesRequestPayload>initialMessage.data;
    if (layer.type == LayerType.POINT) {
      this.checkComplete = () => this._checkComplete();
    } else {
      this.checkComplete = () => this._checkComplete();
    }
  }

  _checkComplete() {
    let flag = false;
    let _shapesCreated = this.tileOverlay.getPureShapes();
    this.tileOverlay.deleteShapesReturn();
    const _shapesDeleted = this.tileOverlay.getPureShapesDeleted();
    this.tileOverlay.deleteShapesDeletedReturn();
    const arrayShapes = this.pagingShapesReturn(_shapesCreated);
    // console.log("next", shapesCreated, shapesDeleted);
    for (let index = 0; index < arrayShapes.length; index++) {
      const shapesCreated = arrayShapes[index];
      const shapesDeleted = _shapesDeleted.splice(0);
      flag = true;
      this.subject.next(new ResultResponse(this.clientProcessId, { shapesDeleted, shapesCreated, loading: this.loading[1] / this.loading[0] }))
    }
    if (_shapesDeleted.length) {
      console.log("TILE PROCESS DELETE", _shapesDeleted);
      flag = true;
      this.subject.next(new ResultResponse(this.clientProcessId, { shapesDeleted: _shapesDeleted, shapesCreated: [], loading: this.loading[1] / this.loading[0] }))
    }
    let shapesUpdated = this.tileOverlay.getPureShapesUpdated();
    this.tileOverlay.deleteShapesUpdatedReturn();
    if (shapesUpdated.length) {
      flag = true;
      this.subject.next(new ResultResponse(this.clientProcessId, { loading: this.loading[1] / this.loading[0], shapesUpdated }))
    }
    if (this.loading[0] == this.loading[1] && this.updateShapeLoading[1] == this.updateShapeLoading[0]) {
      this.tileOverlay.clearDeletedTiles();
      const _shapesDeleted = this.tileOverlay.getPureShapesDeleted();
      this.tileOverlay.deleteShapesDeletedReturn();
      console.log("TILE PROCESS END", _shapesDeleted)
      this.subject.next(new ResultResponse(this.clientProcessId, { shapesDeleted: [..._shapesDeleted], shapesCreated: [], loading: this.loading[1] / this.loading[0] }));
      this.subject.complete();
    }
    if(!flag){
      this.subject.next(new ResultResponse(this.clientProcessId, { loading: this.loading[1] / this.loading[0] }))
    }
  }
}


import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { switchMap, withLatestFrom, map, catchError, filter, first } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { ViewManagementApiService, ViewManagementLogicService, ViewManagementStoreService } from '../../services';
import { viewManagementActions } from "../actions";
import { decorateError, createSimpleError } from '@client/app/shared/http.util';
import { LayerSource } from '@client/app/shared';
import { string_to_slug } from '@periscope-lib/commons/utils/helper';
import { ModalService } from '@client/app/shared/services';
import { InsightViewManagementComponent } from '../../containers';
import { ResultStatus } from '@client/app/shared/models/modal.model';
import { insightResultActions } from 'src/client/app/insight/store/actions';
import { AccountService } from 'src/client/app/shared';
import { InsightStoreService } from '@client/app/insight/services';

@Injectable()
export class ViewManagementEffects {
  constructor(
    private _actions$: Actions,
    private _store: Store,
    private _viewManagementApiService: ViewManagementApiService,
    private _viewManagementLogicService: ViewManagementLogicService,
    private _viewManagementStoreService: ViewManagementStoreService,
    private _modalService: ModalService,
    private _accountService: AccountService,
    private _insightStoreService: InsightStoreService
  ) { }


  @Effect()
  getInsightVies$ = this._actions$.pipe(
    ofType(viewManagementActions.getInsightViews),
    switchMap(_ => {
      return this._viewManagementApiService.getInsightViews().pipe(
        switchMap(views => [viewManagementActions.getInsightViewsSuccess({ views })])
      );
    })
  );

  @Effect()
  getLayers$ = this._actions$.pipe(
    ofType(viewManagementActions.getViewManagementLayers),
    switchMap(_ => {
      return this._viewManagementLogicService.getLayerGroupOptions().pipe(
        switchMap(({ layers, groups }) => [viewManagementActions.getViewManagementLayersSuccess({ layerGroupOptions: groups, layers })])
      );
    })
  );

  @Effect()
  editView$ = this._actions$.pipe(
    ofType(viewManagementActions.editInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$
    ),
    switchMap(([{ id }, views]) => {
      const view = views.find(e => e.id == id);
      if (!view) {
        return [viewManagementActions.editInsightViewFail({ error: createSimpleError("Can not find this insight view") })]
      }
      return [viewManagementActions.editInsightViewSuccess({ view })]
    })
  );

  @Effect()
  createView$ = this._actions$.pipe(
    ofType(viewManagementActions.createInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$,
    ),
    switchMap(([{ view }, views]) => {
      const account = this._accountService.accountStore;
      const id = string_to_slug(`${LayerSource.USER} ${view.name} ${views.length}`);
      view = this._viewManagementLogicService.toInsightView({...view, source: LayerSource.USER}, account.isMetric);
      const updatedViews = [...views, { ...view, id }];
      return this._viewManagementApiService.updateUserStore(updatedViews).pipe(
        switchMap(_ => {
          this._modalService.closeModal(InsightViewManagementComponent, { status: ResultStatus.OK })
          return [viewManagementActions.createInsightViewSuccess({ views: updatedViews }), insightResultActions.selectInsightView({ id })]
        }),
        catchError(err => of(viewManagementActions.createInsightViewFail({ error: decorateError(err) })))
      );
    })
  );

  @Effect()
  updateView$ = this._actions$.pipe(
    ofType(viewManagementActions.updateInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$,
    ),
    switchMap(([{ id, view }, views]) => {
      const account = this._accountService.accountStore;
      const _views = views.slice();
      const index = _views.findIndex(e => e.id == id);
      if (index != -1) {
        const _view = this._viewManagementLogicService.toInsightView({
          ..._views[index],
          ...view,
          id,
          source: LayerSource.USER
        }, account.isMetric);
        _views.splice(index, 1, _view)
        return this._viewManagementApiService.updateUserStore(_views).pipe(
          switchMap(_ => {
            this._modalService.closeModal(InsightViewManagementComponent, { status: ResultStatus.OK })
            return [viewManagementActions.createInsightViewSuccess({ views: _views }), insightResultActions.selectInsightView({ id })]
          }),
          catchError(err => of(viewManagementActions.createInsightViewFail({ error: decorateError(err) })))
        );
      }
      return [viewManagementActions.createInsightViewFail({ error: createSimpleError("Can not find the insight view") })]
    })
  );

  @Effect()
  deleteView$ = this._actions$.pipe(
    ofType(viewManagementActions.deleteInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$,
      this._insightStoreService.selectedView$
    ),
    switchMap(([{ id }, views, selectedView]) => {
      const _views = views.slice();
      const index = _views.findIndex(e => e.id == id);
      if (index != -1) {
        _views.splice(index, 1)
        return this._viewManagementApiService.updateUserStore(_views).pipe(
          switchMap(_ => {
            const actions: any = [viewManagementActions.deleteInsightViewSuccess({ views: _views })];
            if(selectedView && selectedView.id && selectedView.id === id){
              actions.push(insightResultActions.selectInsightView({ id: _views[0].id }));
            }
            return actions
          }),
          catchError(err => of(viewManagementActions.deleteInsightViewFail({ error: decorateError(err) })))
        );
      }
      return [viewManagementActions.deleteInsightViewFail({ error: createSimpleError("Can not find the insight view") })]
    })
  );

  @Effect()
  copyView$ = this._actions$.pipe(
    ofType(viewManagementActions.copyInsightView),
    withLatestFrom(
      this._viewManagementStoreService.insightViews$,
    ),
    switchMap(([{ id }, views]) => {
      const account = this._accountService.accountStore;
      const _views = views.slice();
      const index = _views.findIndex(e => e.id == id);

      if (index != -1) {
        const view = _views[index];
        const name = `${view.name} (Copy)`
        const _id = string_to_slug(`${LayerSource.USER} ${name} ${views.length}`);

        const _view = this._viewManagementLogicService.toInsightView({
          ...view,
          name,
          id: _id,
          source: LayerSource.USER
        }, account.isMetric);
        const updatedViews = [...views, _view];
        return this._viewManagementApiService.updateUserStore(updatedViews).pipe(
          switchMap(_ => {
            this._modalService.closeModal(InsightViewManagementComponent, { status: ResultStatus.OK })
            return [viewManagementActions.copyInsightViewSuccess({ views: updatedViews })]
          }),
          catchError(err => of(viewManagementActions.copyInsightViewFail({ error: decorateError(err) })))
        );
      }
      return [viewManagementActions.createInsightViewFail({ error: createSimpleError("Can not find the insight view") })]
    })
  );
}

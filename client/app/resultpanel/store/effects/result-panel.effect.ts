import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { resultPanelActions } from "../actions";
import { AccountService, PanelService } from '../../../shared';
import { withLatestFrom, switchMap, catchError, filter, first } from 'rxjs/operators';
import { decorateError, createSimpleError } from '@client/app/shared/http.util';
import { TabName, TabType } from '@client/app/shared/models/resultpanel.model';
import { messageActions } from '@client/app/core/store/actions';
import { ActionMessageType } from '@client/app/shared/enums';
import { ResultPanelStoreService } from '../../services';

@Injectable()
export class resultPanelEffects {
  constructor(
    private _actions$: Actions,
    private _accountService: AccountService,
    private _resultPanelStoreService: ResultPanelStoreService,
  ) {
    this._accountService.account
  }


  @Effect()
  getResultPanelTabs$ = this._actions$.pipe(
    ofType(resultPanelActions.settingTabs),
    withLatestFrom(
      this._accountService.account.pipe(first()),
    ),
    switchMap(([_, account]) => {
      try {
        const { viewInsight, viewNearest, hasFind } = account;
        const tabs = [
          { id: TabName.DATA_VIEW, label: 'LAYER DATA', show: true, type: TabType.STATIC },
          { id: TabName.STREET_VIEW, label: 'STREET VIEW', show: true, type: TabType.STATIC },
        ]
        if (hasFind) {
          tabs.push({ id: TabName.FIND, label: 'FIND', show: true, type: TabType.STATIC });
        }
        if (viewInsight) {
          tabs.push({ id: TabName.INSIGHTS, label: 'INSIGHT RESULTS', show: false, type: TabType.DYNAMIC });
        }
        if (viewNearest) {
          tabs.push({ id: TabName.NEAREST, label: 'NEAREST RESULT', show: false, type: TabType.DYNAMIC });
        }
        const activeTab = tabs[0]
        return [
          resultPanelActions.settingTabsSuccess({ tabs }),
          resultPanelActions.setActiveTabSuccess({ activeTab }),
        ]
      } catch {
        return [messageActions.addMessage({
          message: {
            type: ActionMessageType.ERROR,
            value: 'Could not initialize result panel!'
          }
        })]
      }
    }),
  );

  @Effect()
  setResultPanelActiveTab$ = this._actions$.pipe(
    ofType(resultPanelActions.setActiveTab),
    withLatestFrom(
      this._resultPanelStoreService.tabs$
    ),
    switchMap(([{ id }, tabs]) => {
      const activeTab = tabs.find(e => e.id === id);
      if (!activeTab) {
        return [messageActions.addMessage({
          message: {
            type: ActionMessageType.WARNING,
            value: "Can not find tab!"
          }
        })]
      }
      const actions: any[] = [
        resultPanelActions.setActiveTabSuccess({ activeTab })
      ];
      if (!activeTab.show) {
        actions.push(resultPanelActions.toggleTab({ id: activeTab.id, value: true }))
      }
      return actions
    }),
    catchError(error => [messageActions.addMessage({
      message: {
        type: ActionMessageType.ERROR,
        value: decorateError(error).error.message
      }
    })])
  );

  @Effect()
  closeResultPanelTab$ = this._actions$.pipe(
    ofType(resultPanelActions.toggleTab),
    withLatestFrom(
      this._resultPanelStoreService.tabs$,
      this._resultPanelStoreService.activeTab$
    ),
    switchMap(([{ id, value }, _tabs, _activeTab]) => {
      const tabs = _tabs.map(e => (e.id == id ? { ...e, show: value } : { ...e }))
      if (_activeTab && _activeTab.id === id && !value) {
        const activeTab = tabs[0]
        return [
          resultPanelActions.settingTabsSuccess({ tabs }),
          resultPanelActions.setActiveTabSuccess({ activeTab }),
        ]
      }
      return [resultPanelActions.settingTabsSuccess({ tabs })]
    }),
    catchError(error => [messageActions.addMessage({
      message: {
        type: ActionMessageType.ERROR,
        value: decorateError(error).error.message
      }
    })])
  );
}

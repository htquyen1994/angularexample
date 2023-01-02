import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, Effect } from '@ngrx/effects';
import { catchError, map, concatMap, switchMap, takeUntil, first, tap, filter, withLatestFrom, mergeMap } from 'rxjs/operators';
import { EMPTY, of, forkJoin, empty } from 'rxjs';

import {permissionActions} from '../actions/permission.actions';
import { PermissionsService } from '../services/permissions.service';
import { createSimpleError, decorateError } from '../../../shared/models/error';
import { Store, select } from '@ngrx/store';
import { IAppState } from '../../../store/state/app.state';
import { MasterSelector } from '../../../store/selectors';
import { convertToILayer } from '../../../shared/models/layer';
import { MasterDataAction } from 'src/admin/app/store/actions';
import { PermissionsStoreService } from '../services';
import { MasterDataStoreService, ActionMessageService } from '@admin-core/services';
import { TemplateUserState } from '../interfaces';
import { MatDialog } from '@angular/material/dialog';


@Injectable()
export class PermissionEffects {
  private maxNumberUpdateUser = 1;

  getUsersBaseOnTenant$ = createEffect(() =>
    this.actions$.pipe(
      ofType(permissionActions.getUserBaseOnTenant),
      switchMap((action) =>
        this.permissionsService.getUserBaseOnTenant(action.payload)
          .pipe(
            takeUntil(this.actions$.pipe(ofType(permissionActions.getUserBaseOnTenant))),
            switchMap((data) => {
              return of(permissionActions.getUserBaseOnTenantSuccess({ payload: data }));
            }),
            catchError((e: any) => {
              return of(permissionActions.getUserBaseOnTenantFailure({ payload: createSimpleError(e) }));
            })
          )),
    ));

  getLayersBaseOnTenant$ = createEffect(() =>
    this.actions$.pipe(
      ofType(permissionActions.getLayersBaseOnTenant),
      switchMap((action) =>
        forkJoin(
          this.permissionsService.getLayersBaseOnTenant(action.payload.tenantId, action.payload.userName),
          this._store.pipe(
            select(MasterSelector.selectClaims),
            first()
          )
        ).pipe(
          map(([data, claims]) => {
            const groups = data.groups ? data.groups.map(e => {
              return e.layerIds.map(layer => {
                return {
                  layerId: layer,
                  groupName: e.name
                }
              })
            }).reduce((a, b) => {
              return [...a, ...b]
            }) : []
            const layers = data.data.map(e => {
              const group = groups.find(_e => e['bundleId'] ?  _e.layerId == e['bundleId'] : _e.layerId == e['dataPackageId']);
              return convertToILayer(e, claims, group ? group.groupName : undefined);
            });
            return permissionActions.getLayersBaseOnTenantSuccess({ payload: { layers, tenantId: data.tenantId, userName: action.payload.userName } })
          }),
          catchError((e: any) => {
            return of(permissionActions.getLayersBaseOnTenantFailure({ payload: createSimpleError(e) }));
          }),
        takeUntil(this.actions$.pipe(ofType(permissionActions.getLayersBaseOnTenant))),
        ),
      ),
      catchError((e: any) => {
        return of(permissionActions.getLayersBaseOnTenantFailure({ payload: createSimpleError(e) }));
      }),
    ));

  @Effect()
  getTemplateUsers$ = this._actions$.pipe(
    ofType(permissionActions.getTemplateUsers),
    switchMap(({ templateId, tenantId }) => {
      return this.permissionsService.getUsersOfTemplate(tenantId, templateId).pipe(
        switchMap(res=>{
          const users: TemplateUserState[] = res.affectedUsers.map(username=> ({
              username,success: null, error: null, updating: false
          }) as TemplateUserState)
          return [permissionActions.getTemplateUsersSuccess({users})]
        }),
        catchError((e)=> [permissionActions.getTemplateUsersFail({error: decorateError(e)})])
      )
    })
  );

   @Effect()
   sequenceUpdateTemplateUser$ = this._actions$.pipe(
     ofType(
       permissionActions.sequenceUpdateTemplateUser,
     ),
     withLatestFrom(
       this._permissionStoreService.templateUsers$,
     ),
    switchMap(([_, _users]) => {

      const isUpdatingUser = !!_users.find(e=>e.updating);
      if (isUpdatingUser) {
        return EMPTY;
      }

      const usersUpdating = _users.filter(e => !(e.error || e.success)).slice(0, this.maxNumberUpdateUser);
      if (usersUpdating.length) {
        const users = _users.slice().map(user => {
          const updating = !!usersUpdating.find(e => e.username === user.username);
          return {
            ...user,
            updating
          }
        })
        return [
          permissionActions.updateTemplateUsersStore({ users }),
          ...usersUpdating.map(user => permissionActions.updateTemplateUser({ username: user.username }))
        ]
      }
      if(!_users.length){
        return EMPTY;
      }
      const isError = !!_users.find(e=>e.error);
      if (!isError) {
        const dialogRef = this._dialog.getDialogById('EditTemplateDialogComponent');
        if(dialogRef){
          dialogRef.close({reload: true});
        }
        this._actionMessageService.sendSuccess('Template and user data permissions were successfully updated')
      }
      return EMPTY
    })
  );

  @Effect()
  updateTemplateUser$ = this._actions$.pipe(
    ofType(permissionActions.updateTemplateUser),
    withLatestFrom(
      this._permissionStoreService.templateState$
    ),
    mergeMap(([{ username }, templateState]) => {
      const {tenantId, templateId, layers } = templateState;
      return this.permissionsService.updateTemplateUser(tenantId, templateId, username,layers ).pipe(
        takeUntil(this._actions$.pipe(ofType(permissionActions.cancelUpdatingTemplate))),
        switchMap(res=>{
          return [permissionActions.updateTemplateUserSuccess({username})]
        }),
        catchError((e) => [permissionActions.updateTemplateUserFail({ username, error: decorateError(e) })])
      )
    })
  );

  @Effect()
  updateTemplateUsersStoreSuccess$ = this._actions$.pipe(
    ofType(
      permissionActions.updateTemplateUserSuccess,
    ),
    withLatestFrom(
      this._permissionStoreService.templateUsers$,
    ),
    mergeMap(([action, _users]) => {
      const { username } = action;
      const index = _users.findIndex(e => e.username === username);
      if (index == -1) {
        return EMPTY
      }
      const users = _users.slice();
      users.splice(index, 1, { ..._users[index], success: true, updating: false});
      const actions: any[] = [
        permissionActions.updateTemplateUsersStore({ users }),
        permissionActions.sequenceUpdateTemplateUser()
      ];
      return actions;
    })
  );

  @Effect()
  updateTemplateUsersStoreFail$ = this._actions$.pipe(
    ofType(
      permissionActions.updateTemplateUserFail,
    ),
    withLatestFrom(
      this._permissionStoreService.templateUsers$,
    ),
    mergeMap(([action, _users]) => {
      const { username, error } = action;
      const index = _users.findIndex(e => e.username === username);
      if (index == -1) {
        return EMPTY
      }
      const users = _users.slice();
      users.splice(index, 1, { ..._users[index], success: false, error, updating: false });
      const actions: any[] = [
        permissionActions.updateTemplateUsersStore({ users }),
        permissionActions.sequenceUpdateTemplateUser()
      ];
      return actions
    })
  );

  @Effect()
  updateTemplateUsersStoreByUsername$ = this._actions$.pipe(
    ofType(
      permissionActions.updateTemplateUsersStoreByUsername,
    ),
    withLatestFrom(
      this._permissionStoreService.templateUsers$,
    ),
    mergeMap(([{user, username}, _users]) => {
      const index = _users.findIndex(e => e.username === username);
      if (index == -1) {
        return EMPTY
      }
      const users = _users.slice();
      users.splice(index, 1, { ..._users[index], ...user});
      const actions: any[] = [
        permissionActions.updateTemplateUsersStore({ users }),
      ];
      return actions;
    })
  );

  @Effect()
  patchTemplateState$ = this._actions$.pipe(
    ofType(
      permissionActions.patchTemplateState
    ),
    mergeMap(({tenantId}) =>
      of(tenantId).pipe(
        withLatestFrom(
          this._masterDataStoreService.getTemplates(tenantId)
        ),
        map(([tenantId, templates])=> templates)
      ),
      ({templateId, tenantId, layers}, templates) => ({
        templateId,
        tenantId,
        templates,
        layers
      })
    ),
    switchMap(({templateId, tenantId, templates, layers}) => {
      const template = templates.find(e=>e.templateId == templateId);
      if(!template) {
        return EMPTY
      }
      const { templateName } = template;
      return [
        permissionActions.patchTemplateStateSuccess({templateState: {
          isLoading: false,
          layers,
          templateId,
          templateName,
          tenantId,
          users: [],
          error: null
        }}),
        permissionActions.getTemplateUsers({ templateId, tenantId })
      ]
    })
  );

  @Effect()
  updateTemplate$ = this._actions$.pipe(
    ofType(
      permissionActions.updateTemplate,
    ),
    withLatestFrom(
      this._permissionStoreService.templateUsers$
    ),
    switchMap(([{templateState}, users]) => {
      const { tenantId, templateId, templateName, layers } = templateState;
      return this.permissionsService.updatePermissionTemplate({tenantId, name: templateName, layers, templateId}).pipe(
        takeUntil(this._actions$.pipe(ofType(permissionActions.cancelUpdatingTemplate))),
        switchMap(()=>{
          if(users.length){
            return [
              permissionActions.updateTemplateSuccess(),
              MasterDataAction.loadPermissionTemplates({ payload: { tenantId } }),
              permissionActions.sequenceUpdateTemplateUser()
            ]
          }
          const dialogRef = this._dialog.getDialogById('EditTemplateDialogComponent');
          if(dialogRef){
            dialogRef.close({reload: true});
          }
          this._actionMessageService.sendSuccess('Template successfully updated')
          return [
            permissionActions.updateTemplateSuccess(),
            MasterDataAction.loadPermissionTemplates({payload: {tenantId}})
          ]
        }),
        catchError(err=>[permissionActions.updateTemplateFail({error: decorateError(err)})])
      )
    })
  );

  constructor(private actions$: Actions,
    private permissionsService: PermissionsService,
    private _store: Store<IAppState>,
    private _actions$: Actions,
    private _permissionStoreService: PermissionsStoreService,
    private _masterDataStoreService: MasterDataStoreService,
    private _dialog: MatDialog,
    private _actionMessageService: ActionMessageService
  ) { }

}

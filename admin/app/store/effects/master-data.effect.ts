
import { Injectable } from '@angular/core';
import { ofType, Actions, createEffect } from '@ngrx/effects';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import { MasterDataAction } from '../actions';
import { MasterDataService } from '../../core/services/master-data.service';
import { ITenant } from '../../shared/models/tenant';
import { createSimpleError } from '../../shared/models/error';
import { IClaim } from '../../shared/models/permisions';
import { IPermissionTemplate } from '../state/master-data.state';
import { convertToILayer } from '@admin-shared/models/layer';
import { Store, select } from '@ngrx/store';
import { IAppState } from '../state/app.state';
import { MasterSelector } from '../selectors';
@Injectable()
export class MasterDataEffects {
    constructor(
        private actions$: Actions,
        private masterDataService: MasterDataService,
        private _store: Store<IAppState>) { }

    getTenants$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MasterDataAction.getTenants),
            switchMap(() => this.masterDataService.getMasterDataTenants().pipe(
                switchMap((data: ITenant[]) => {
                    return of(MasterDataAction.getTenantsSuccess({ payload: data }));
                }),
                catchError((e: any) => {
                    return of(MasterDataAction.getTenantsFailure({ payload: createSimpleError(e) }));
                })
            )),

        ));
    getClaims$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MasterDataAction.getClaims),
            switchMap(() => this.masterDataService.getAllAvailableLayerClaim().pipe(
                switchMap((data: IClaim[]) => {
                    return of(MasterDataAction.getClaimsSuccess({ payload: data }));
                }),
                catchError((e: any) => {
                    return of(MasterDataAction.getClaimsFailure({ payload: createSimpleError(e) }));
                })
            )),

        ));

    getMembership$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MasterDataAction.getMemberships),
            switchMap((action) => this.masterDataService.getMemberShipLevels(action.payload).pipe(
                switchMap(data => {
                    return of(MasterDataAction.getMembershipsSuccess({ payload: { tenantId: action.payload, memberShipLevels: data } }));
                }),
                catchError(e => {
                    return of(MasterDataAction.getMembershipsFailure({ payload: createSimpleError(e) }));
                })
            ))
        ));

    getPermissionTemplates$ = createEffect(() =>
        this.actions$.pipe(
            ofType(MasterDataAction.loadPermissionTemplates),
            switchMap((action) =>
                this.masterDataService.getPermissionTemplates(action.payload.tenantId)
                    .pipe(
                        takeUntil(this.actions$.pipe(ofType(MasterDataAction.loadPermissionTemplates))),
                        switchMap((_data: any[]) =>
                            this._store.pipe(
                                select(MasterSelector.selectClaims),
                                switchMap((claims) => {
                                    const data: IPermissionTemplate[] = _data.map(e => {
                                        const layers = e.dataPackages.map(_e => convertToILayer(_e, claims))
                                        return {
                                            templateId: e.templateId,
                                            templateName: e.templateName,
                                            layers
                                        }
                                    });
                                    return of(MasterDataAction.loadPermissionTemplatesSuccess({ payload: { tenantId: action.payload.tenantId, data } }));
                                }),
                                catchError((e: any) => {
                                    return of(MasterDataAction.loadPermissionTemplatesFailure({ payload: createSimpleError(e) }));
                                }))
                        ),
                        catchError((e: any) => {
                            return of(MasterDataAction.loadPermissionTemplatesFailure({ payload: createSimpleError(e) }));
                        })
                    )),
        ));
}

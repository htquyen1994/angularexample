import { createAction, props } from '@ngrx/store';
import { IAccount } from '../../shared/models/account';

export enum EAccount {
    GetAccount = '[Account] Get Account',
    GetAccountSuccess = '[Account] Get Account Success',
}

export const GetAccount = createAction(
    EAccount.GetAccount
);
export const GetAccountSuccess = createAction(
    EAccount.GetAccountSuccess,
    props<{ payload: IAccount }>()
);

import { initialAccountState } from './account.state';
import { IAccount } from '../../shared/models/account';
import { initialConfigState, IConfigState } from './config.state';
import { IMasterDataState, initialMasterDataState } from './master-data.state';


export interface IAppState {
  account: IAccount,
  config: IConfigState,
  masterData: IMasterDataState
}

export const initialAppState: IAppState = {
  account: initialAccountState,
  config: initialConfigState,
  masterData: initialMasterDataState
};

export function getInitialState(): IAppState {
  return initialAppState;
}

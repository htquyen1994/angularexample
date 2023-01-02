import { IErrorResponse } from '@admin-shared/models/error';



export interface IFunctionality {
  id: string;
  category: string;
  name: string;
  description: string;
  icons: string[];
  hasAccess: {
    [key: string]: boolean
  }
}

export interface IFunctionalityResponse {
  category: string;
  name: string;
  description: string;
  icons: string[];
  hasAccess: string[]
}

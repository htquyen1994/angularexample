import { FunctionalityState } from "../interfaces";

export const functionalityFeature = 'functionality'

export const  initialFunctionalityState: FunctionalityState = {
  loading: false,
  filter: {
    tenantId: null,
  },
  result: null,
  error: null,
  downloading: false
}

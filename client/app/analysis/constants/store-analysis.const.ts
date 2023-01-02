import { AnalysisState } from "../interfaces";

export const featureAnalysis = 'featureAnalysis';

export const initialAnalysisState: AnalysisState = {
  error: null,
  loading: false,
  previewModel: null,
};

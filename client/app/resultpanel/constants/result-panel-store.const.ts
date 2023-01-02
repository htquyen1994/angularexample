import {  ResultPanelState } from "../interfaces";

export const featureResultPanel = 'resultPanel';

export const initialResultPanelState: ResultPanelState = {
  tabState: {
    activeTab: null,
    loading: false,
    tabs: []
  }
};

import { Tab } from "../../shared/models/resultpanel.model";

export interface ResultPanelState {
  tabState: ResultPanelTabState;
}

export interface ResultPanelTabState {
  loading: boolean;
  tabs: Tab[];
  activeTab: Tab;
}

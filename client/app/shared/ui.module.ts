import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxPipeFunctionModule } from 'ngx-pipe-function';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { SliderModule } from 'primeng/slider';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import {InputNumberModule} from 'primeng/inputnumber';
import {KeyFilterModule} from 'primeng/keyfilter';

import { OrderListComponent } from './order-list/order-list.component';

import { TabViewModule } from '@periscope-lib/tab-view/tab-view.module';
import { ChartModule } from '@periscope-lib/chart/chart.module';
import { InputModule } from '@periscope-lib/form/input/input.module';
import { CommonsModule } from '@periscope-lib/commons/commons.module';
import { TableModule as PeriscopeTable } from '@periscope-lib/table/table.module';
import { PsPrimengModule } from '@periscope-lib/ps-primeng/ps-primeng.module';
import { SpinnerModule } from '@periscope-lib/spinner/spinner.module';
import { SelectionButtonModule, SplitButtonModule } from '@periscope-lib/buttons';
import { SelectModule } from '@periscope-lib/form/select/select.module';
import {
  DividerModule,
  FieldsetModule
} from '@periscope-lib/components';

import { OutreachServiceInfoComponent } from '../resultpanel/result/details-panel/outreach-services/outreach-service-info/outreach-service-info.component';

import {
  NumrounddownPipe,
  DistancePipe,
  DynamicPipe,
  Divide100Pipe,
  DistanceValuePipe
} from './pipes';

import {
  InputValidatorDirective,
  OnlyNumberDirective
} from './directives';

import {
  ButtonComponent,
  ButtonGroupComponent,
  CheckboxComponent,
  DialogComponent,
  DropdownComponent,
  IconSelectComponent,
  InfoButtonComponent,
  ToolbarComponent,
  SpinnerProgressComponent,
  SliderComponent,
  OverlaypanelComponent,
  SliderCustomComponent,
  SliderInfoComponent,
  FilterInputComponent,
  MathInputComponent,
  MultiSelectComponent,
  MultiSelectItemComponent,
  DynamicConfirmComponent,
  ButtonGroupColumnComponent,
  MultiSelectFilterComponent
 } from './components';

 import {
  ServerDownDialogComponent,
  DeleteConfirmComponent,
  ComponentTemplateDirective,
  DynamicDialogComponent,
  ErrorMessageComponent,
  FeatureShareFormComponent,
  LocationFormComponent
 } from './containers';

 import {
  FileDropDirective,
  FileSelectDirective,
  AppTrackDirective,
} from './index';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

const MODULES = [
  CommonModule,
  CommonsModule,
  BrowserModule,
  FormsModule,
  ReactiveFormsModule,
  BrowserAnimationsModule,
  MatIconModule,
  MatNativeDateModule,
  MatDatepickerModule,
  MatAutocompleteModule,
  MatProgressSpinnerModule,
  MatIconModule,
  MatSlideToggleModule,
  MatAutocompleteModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatSliderModule,
  TooltipModule,
  TableModule,
  DynamicDialogModule,
  OverlayPanelModule,
  VirtualScrollerModule,
  TabViewModule,
  ChartModule,
  InputModule,
  NgxPipeFunctionModule,
  PeriscopeTable,
  PsPrimengModule,
  ButtonModule,
  LazyLoadImageModule,
  SpinnerModule,
  DragDropModule,
  ClipboardModule,
  SelectionButtonModule,
  SliderModule,
  SelectModule,
  InfiniteScrollModule,
  FieldsetModule,
  InputNumberModule,
  KeyFilterModule,
  SplitButtonModule,
  DividerModule
]

const COMPONENTS = [
  ToolbarComponent,
  ButtonComponent,
  ButtonGroupComponent,
  CheckboxComponent,
  DialogComponent,
  DropdownComponent,
  LocationFormComponent,
  FileDropDirective,
  FileSelectDirective,
  IconSelectComponent,
  SpinnerProgressComponent,
  SliderComponent,
  InfoButtonComponent,
  ErrorMessageComponent,
  MultiSelectComponent,
  MultiSelectItemComponent,
  SliderCustomComponent,
  SliderInfoComponent,
  FilterInputComponent,
  DeleteConfirmComponent,
  OrderListComponent,
  MathInputComponent,
  OverlaypanelComponent,
  OutreachServiceInfoComponent,
  ServerDownDialogComponent,
  FeatureShareFormComponent,
  DynamicDialogComponent,
  DynamicConfirmComponent,
  ButtonGroupColumnComponent,
  MultiSelectFilterComponent
]

const DIRECTIVE = [
  AppTrackDirective,
  OnlyNumberDirective,
  InputValidatorDirective,
  ComponentTemplateDirective,
]

const PIPES = [
  NumrounddownPipe,
  DistancePipe,
  DynamicPipe,
  Divide100Pipe,
  DistanceValuePipe
]

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    ...MODULES
  ],
  declarations: [
    ...COMPONENTS,
    ...DIRECTIVE,
    ...PIPES
  ],
  exports: [
    ...MODULES,
    ...COMPONENTS,
    ...DIRECTIVE,
    ...PIPES
  ],
  entryComponents: [
    DeleteConfirmComponent,
    ServerDownDialogComponent,
    DynamicDialogComponent,
    DynamicConfirmComponent
  ]
})
export class UiModule {
}

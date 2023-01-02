import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent, GoTableHeaderDirective, GoTableRowDirective, GoToolPanelDirective, GoTableFooterDirective } from './table/table.component';
import { PaginatorModule } from './paginator/paginator.module';
import { SpinnerModule } from '../spinner/spinner.module';
import { ResizeService } from '../commons/services/resize.service';
import { ToolPanelComponent } from './tool-panel/tool-panel.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NgxPipeFunctionModule } from 'ngx-pipe-function';

@NgModule({
  declarations: [TableComponent, GoTableHeaderDirective, GoTableRowDirective, ToolPanelComponent, GoToolPanelDirective, GoTableFooterDirective],
  imports: [CommonModule, PaginatorModule, SpinnerModule, MatInputModule, MatCheckboxModule,FormsModule],
  providers: [ResizeService],
  exports: [TableComponent, GoTableHeaderDirective, GoTableRowDirective, PaginatorModule, ToolPanelComponent, GoToolPanelDirective, GoTableFooterDirective]
})
export class TableModule { }

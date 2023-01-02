import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerModule } from '../spinner/spinner.module';
import { ChartsModule } from 'ng2-charts';
import { LineChartComponent } from './line-chart/line-chart.component';
import { PipeChartComponent } from './pipe-chart/pipe-chart.component';
import 'chartjs-plugin-colorschemes/src/plugins/plugin.colorschemes';
@NgModule({
    declarations: [LineChartComponent,PipeChartComponent],
    imports: [CommonModule, ChartsModule, SpinnerModule],
    exports: [LineChartComponent, PipeChartComponent]
})
export class ChartModule { }

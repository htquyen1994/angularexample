import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from './paginator.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [PaginatorComponent],
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule],
  exports: [PaginatorComponent]
})
export class PaginatorModule {}

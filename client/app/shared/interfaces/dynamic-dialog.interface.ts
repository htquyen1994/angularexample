import { TemplateRef } from '@angular/core';

export interface IDynamicDialogData {
  id?: string;
  component: any;
  title: string;
  data?: any;
  position?: { x: number, y: number };
  instructionsHTML?: string
}

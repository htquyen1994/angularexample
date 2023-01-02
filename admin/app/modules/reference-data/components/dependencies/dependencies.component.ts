import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder } from '@angular/forms';
import { IDropdownItem } from '@admin-shared/components/periscope-dropdown/periscope-dropdown';
import { Observable } from 'rxjs';

export interface IDependenciesViewData {
  tenantName:string;
  tenantViews: string[];
  rowSpan: number;
  userViews: {
    userName: string;
    viewNames: string[];
    rowSpan: number;
  }[]
}
@Component({
  selector: 'ps-dependencies',
  templateUrl: './dependencies.component.html',
  styleUrls: ['./dependencies.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependenciesComponent implements OnInit {
  form: FormGroup;
  dependencyTypes: IDropdownItem[] = [{
    id: 'insightView',
    name: 'Insight View'
  }
    // ,{
    //   id: 'matchitView',
    //   name: 'Matchit View'
    // }
  ]
  referencedInsightViews$: Observable<IDependenciesViewData[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DependenciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) {
    const { type, insightView } = data;
    this.form = this.fb.group({
      type: [type],
    })
    this.referencedInsightViews$ = insightView;
    (<Observable<any>>insightView).subscribe(e=>{console.log(e)})
    console.log(insightView);
  }

  ngOnInit() {
  }

  onCancel() {
    this.dialogRef.close();
  }

}

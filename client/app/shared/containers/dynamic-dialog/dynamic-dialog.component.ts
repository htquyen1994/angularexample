import { Component, OnInit, Inject, ViewChild, NgZone, Directive, ViewContainerRef, ComponentFactoryResolver, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter, TemplateRef, Renderer2 } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogComponent } from '@client/app/shared/components';
import { IDynamicDialogData } from '@client/app/shared/interfaces';

@Directive({ selector: '[componentTemplate]' })
export class ComponentTemplateDirective {
  constructor(public viewContainerRef: ViewContainerRef){
  }
}

@Component({
  selector: 'ps-dynamic-dialog',
  templateUrl: './dynamic-dialog.component.html',
  styleUrls: ['./dynamic-dialog.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class DynamicDialogComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  public dialog: DialogComponent;
  @ViewChild(ComponentTemplateDirective, {static: true})
  public componentRef: ComponentTemplateDirective;
  @Output() positionChanged = new EventEmitter<any>();
  public title = '';
  public innitPosition: { x: number, y: number };
  public instructionsHTML: string;

  constructor(
    private ngZone: NgZone,
    private dialogRef: MatDialogRef<DynamicDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public _data: IDynamicDialogData,
    private componentFactoryResolver: ComponentFactoryResolver,
    private renderer2: Renderer2
  ) { }

  ngOnInit(): void {
  }

  ngAfterContentInit() {
    const {component, data, position, title, instructionsHTML} = this._data;
    if(position){
      this.innitPosition = {...position}
    }
    if(title){
      this.title = title;
    }
    if(instructionsHTML){
      this.instructionsHTML = instructionsHTML
    }
    this.loadComponent(component, data);
    this.dialog.onHide(false);
  }

  onDialogClose(result?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(result);
    })
  }

  loadComponent(component, data) {

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);

    const viewContainerRef = this.componentRef.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<any>(componentFactory);
    componentRef.instance.data = data;
  }

  onPositionChange(event) {
    this.positionChanged.next(event);
  }

  onShowInstructions(event){
  }
}

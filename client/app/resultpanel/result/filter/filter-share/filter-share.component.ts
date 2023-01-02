import { Component, ViewChild, EventEmitter, Output, Inject, Input, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {
  LayerService,
  IErrorResponse,
  AccountService,
  ActionMessageService,
  FilterService,
  LayerSource
} from '../../../../shared';
import {
  DialogComponent,
} from '@client/app/shared/components'

import { Observable } from 'rxjs';
import { startWith, map, tap } from 'rxjs/operators';
import { ILayer, IFilter } from '../../../../shared/interfaces';
import { decorateError } from '../../../../shared/http.util';


interface SharedUser {
  userId: string;
  name: string;
  permission?: number;
}

@Component({
  selector: 'go-filter-share',
  moduleId: module.id,
  templateUrl: 'filter-share.component.html',
  styleUrls: ['filter-share.component.less']
})
export class FilterShareComponent implements OnInit {
  @ViewChild('shareFilterDialog', { static: true }) dialog: DialogComponent;

  @Input() LayerSource: Observable<ILayer>;
  @Input() filterSource: Observable<IFilter>;
  @Output() close = new EventEmitter<boolean>();
  filter: IFilter;
  layer: ILayer;
  form: FormGroup;
  error: IErrorResponse;
  isLoading = false;
  isValidAdd = false;

  optionsTable: { [userId: string]: string } = {};
  options: SharedUser[] = [];
  sharedOptions: string[] = [];
  filteredOptions: Observable<SharedUser[]>;
  userAddedOrRemoved = false;
  get usersControls(){
    return this.form ? (<FormArray>this.form.get('users')).controls : []
  }
  constructor(@Inject(FormBuilder) private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private actionMessageService: ActionMessageService,
    private layerService: LayerService,
    private filterService: FilterService) {
      this.getLayerUserList();
  }

  ngOnInit() {
    this.filterSource.subscribe(data => {
      this.filter = data;
      if (data) {
        this.openDialog();
      }
    })
    this.LayerSource.subscribe(data => {
      if (data) {
        this.layer = data;
        this.form.patchValue({
          layerId: data.id
        })
      }
    })
    this.form = this.formBuilder.group({
      layerId: [''],
      autocomplete: [''],
      users: this.formBuilder.array([])
    });

    this.filteredOptions = this.form.controls.autocomplete.valueChanges
      .pipe(
        startWith(''),
        tap(value => this.checkValidAdd(value)),
        map(value => this._filter(value))
      );
  }

  getLayerUserList() {
    this.layerService.getLayerUserList().subscribe(data => {
      this.optionsTable = {};
      this.options = data
        .filter(user => this.accountService.accountStore.username !== user.username && !user.enabled)
        .map(user => {
          const name = `${user.forename} ${user.surname}`;
          this.optionsTable[user.username] = name;
          return {
            userId: user.username,
            name
          };
        });
      this.form.patchValue({
        autocomplete: ''
      })
      this.changeDetectorRef.detectChanges();
    });
  }


  checkValidAdd(value) {
    const x = this.options
      .filter(user => user.name.toLowerCase() === value.toLowerCase());

    this.isValidAdd = x.length === 1;
  }

  private _filter(value: string): SharedUser[] {
    const filterValue = value.toLowerCase();

    const users: string[] = this.form.getRawValue().users.map(user => user.userId);

    return this.options
      .filter(user => user.name.toLowerCase().includes(filterValue) && !users.includes(user.userId));
  }

  onClose(state: boolean) {
    this.dialog.onHide(true);
    this.close.emit(state);
  }


  onComplete() {
    this.isLoading = true;
    const users = this.form.getRawValue().users.map(user => user.userId);

    if (this.filter.source !== LayerSource.CORPORATE) {
      this.filterService.copyToUsers(this.layer.id, this.filter, users)
        .subscribe(
          data => {
            this.isLoading = false;
            this.actionMessageService.sendInfo(`Filter '${this.filter.name}' successfully copied to ${data.length} users`);
            this.onClose(true);
          },
          error => {
            this.error = decorateError(error);
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
          });
    }
  }

  addUserFromAutocomplete() {
    const user = this.options.find(x => x.name === this.form.controls.autocomplete.value);
    if (user) {
      this.addUser(user.userId, 0);
    }

    this.changeDetectorRef.detectChanges();
  }

  addUser(userId, permission) {
    (<FormArray>this.form.controls.users).push(
      this.formBuilder.group({
        permission: [permission],
        userId: [userId]
      })
    );
    this.form.controls.autocomplete.setValue('');
    this.userAddedOrRemoved = true;
  }

  deleteUser(index: number) {
    (<FormArray>this.form.controls.users).removeAt(index);
    this.form.controls.autocomplete.setValue('');
    this.userAddedOrRemoved = true;
    this.changeDetectorRef.detectChanges();
  }

  openDialog() {
    this.dialog.onHide(false);
    this.changeDetectorRef.detectChanges();
  }
}


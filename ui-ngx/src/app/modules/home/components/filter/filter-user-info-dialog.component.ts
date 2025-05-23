///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { Component, Inject, SkipSelf } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { FormGroupDirective, NgForm, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogComponent } from '@app/shared/components/dialog.component';
import {
  BooleanOperation,
  createDefaultFilterPredicateUserInfo,
  EntityKeyValueType,
  generateUserFilterValueLabel,
  KeyFilterPredicateUserInfo,
  NumericOperation,
  StringOperation
} from '@shared/models/query/query.models';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FilterUserInfoDialogData {
  key: string;
  valueType: EntityKeyValueType;
  operation: StringOperation | BooleanOperation | NumericOperation;
  keyFilterPredicateUserInfo: KeyFilterPredicateUserInfo;
  readonly: boolean;
}

@Component({
  selector: 'tb-filter-user-info-dialog',
  templateUrl: './filter-user-info-dialog.component.html',
  providers: [{provide: ErrorStateMatcher, useExisting: FilterUserInfoDialogComponent}],
  styleUrls: []
})
export class FilterUserInfoDialogComponent extends
  DialogComponent<FilterUserInfoDialogComponent, KeyFilterPredicateUserInfo>
  implements ErrorStateMatcher {

  filterUserInfoFormGroup: UntypedFormGroup;

  submitted = false;
  showUniInput = false;

  constructor(protected store: Store<AppState>,
              protected router: Router,
              @Inject(MAT_DIALOG_DATA) public data: FilterUserInfoDialogData,
              @SkipSelf() private errorStateMatcher: ErrorStateMatcher,
              public dialogRef: MatDialogRef<FilterUserInfoDialogComponent, KeyFilterPredicateUserInfo>,
              private fb: UntypedFormBuilder,
              private translate: TranslateService) {
    super(store, router, dialogRef);

    const userInfo: KeyFilterPredicateUserInfo = this.data.keyFilterPredicateUserInfo || createDefaultFilterPredicateUserInfo();

    this.filterUserInfoFormGroup = this.fb.group(
      {
        editable: [userInfo.editable],
        label: [userInfo.label],
        autogeneratedLabel: [!userInfo.autogeneratedLabel],
        order: [userInfo.order]
      }
    );
    if (this.data.valueType === EntityKeyValueType.NUMERIC) {
      this.showUniInput = true;
      this.filterUserInfoFormGroup.addControl('unit', this.fb.control(userInfo.unit), {emitEvent: false});
    }
    this.onAutogeneratedLabelChange();
    if (!this.data.readonly) {
      this.filterUserInfoFormGroup.get('autogeneratedLabel').valueChanges.pipe(
        takeUntilDestroyed()
      ).subscribe(() => {
        this.onAutogeneratedLabelChange();
      });
    } else {
      this.filterUserInfoFormGroup.disable({emitEvent: false});
    }
  }

  private onAutogeneratedLabelChange() {
    const autogeneratedLabel: boolean = !this.filterUserInfoFormGroup.get('autogeneratedLabel').value;
    if (autogeneratedLabel) {
      const generatedLabel = generateUserFilterValueLabel(this.data.key, this.data.valueType, this.data.operation, this.translate);
      this.filterUserInfoFormGroup.get('label').patchValue(generatedLabel, {emitEvent: false});
      this.filterUserInfoFormGroup.get('label').disable({emitEvent: false});
    } else {
      this.filterUserInfoFormGroup.get('label').enable({emitEvent: false});
    }
  }

  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const originalErrorState = this.errorStateMatcher.isErrorState(control, form);
    const customErrorState = !!(control && control.invalid && this.submitted);
    return originalErrorState || customErrorState;
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    this.submitted = true;
    if (this.filterUserInfoFormGroup.valid) {
      const keyFilterPredicateUserInfo: KeyFilterPredicateUserInfo = this.filterUserInfoFormGroup.getRawValue();
      keyFilterPredicateUserInfo.autogeneratedLabel = !keyFilterPredicateUserInfo.autogeneratedLabel;
      this.dialogRef.close(keyFilterPredicateUserInfo);
    }
  }
}

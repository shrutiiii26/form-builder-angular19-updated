import { createAction, props } from '@ngrx/store';
import { FormSchema } from '../../core/services/indexeddb.service';

export const loadForms = createAction('[Forms] Load Forms');

export const loadFormsSuccess = createAction(
  '[Forms] Load Forms Success',
  props<{ forms: FormSchema[] }>()
);

export const loadFormsFailure = createAction(
  '[Forms] Load Forms Failure',
  props<{ error: string }>()
);

export const saveForm = createAction(
  '[Forms] Save Form',
  props<{ form: FormSchema }>()
);

export const saveFormSuccess = createAction(
  '[Forms] Save Form Success',
  props<{ form: FormSchema }>()
);

export const saveFormFailure = createAction(
  '[Forms] Save Form Failure',
  props<{ error: string }>()
);

export const createForm = createAction(
  '[Forms] Create Form',
  props<{ form: FormSchema }>()
);

export const createFormSuccess = createAction(
  '[Forms] Create Form Success',
  props<{ form: FormSchema }>()
);

export const deleteForm = createAction(
  '[Forms] Delete Form',
  props<{ id: string }>()
);

export const deleteFormSuccess = createAction(
  '[Forms] Delete Form Success',
  props<{ id: string }>()
);

export const selectForm = createAction(
  '[Forms] Select Form',
  props<{ id: string }>()
);

export const resetData = createAction('[Forms] Reset Data');

export const resetDataSuccess = createAction('[Forms] Reset Data Success');

import { createReducer, on } from '@ngrx/store';
import { FormSchema } from '../../core/services/indexeddb.service';
import * as FormsActions from './forms.actions';

export interface FormsState {
  forms: FormSchema[];
  selectedFormId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: FormsState = {
  forms: [],
  selectedFormId: null,
  loading: false,
  error: null
};

export const formsReducer = createReducer(
  initialState,

  on(FormsActions.loadForms, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(FormsActions.loadFormsSuccess, (state, { forms }) => ({
    ...state,
    forms,
    loading: false
  })),

  on(FormsActions.loadFormsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(FormsActions.saveFormSuccess, (state, { form }) => ({
    ...state,
    forms: state.forms.map(f => f.id === form.id ? form : f)
  })),

  on(FormsActions.createFormSuccess, (state, { form }) => ({
    ...state,
    forms: [...state.forms, form]
  })),

  on(FormsActions.deleteFormSuccess, (state, { id }) => ({
    ...state,
    forms: state.forms.filter(f => f.id !== id),
    selectedFormId: state.selectedFormId === id ? null : state.selectedFormId
  })),

  on(FormsActions.selectForm, (state, { id }) => ({
    ...state,
    selectedFormId: id
  })),

  on(FormsActions.resetDataSuccess, (state) => ({
    ...state,
    selectedFormId: null
  }))
);

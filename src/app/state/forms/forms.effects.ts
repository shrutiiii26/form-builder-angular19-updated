import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { IndexedDBService } from '../../core/services/indexeddb.service';
import * as FormsActions from './forms.actions';

@Injectable()
export class FormsEffects {

  loadForms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FormsActions.loadForms),
      switchMap(() =>
        from(this.db.getAllForms()).pipe(
          map(forms => FormsActions.loadFormsSuccess({ forms })),
          catchError(error => of(FormsActions.loadFormsFailure({ error: error.message })))
        )
      )
    )
  );

  saveForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FormsActions.saveForm),
      switchMap(({ form }) =>
        from(this.db.saveForm(form)).pipe(
          map(() => FormsActions.saveFormSuccess({ form })),
          catchError(error => of(FormsActions.saveFormFailure({ error: error.message })))
        )
      )
    )
  );

  createForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FormsActions.createForm),
      switchMap(({ form }) =>
        from(this.db.createForm(form)).pipe(
          map(() => FormsActions.createFormSuccess({ form })),
          catchError(error => of(FormsActions.loadFormsFailure({ error: error.message })))
        )
      )
    )
  );

  deleteForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FormsActions.deleteForm),
      switchMap(({ id }) =>
        from(this.db.deleteForm(id)).pipe(
          map(() => FormsActions.deleteFormSuccess({ id })),
          catchError(error => of(FormsActions.loadFormsFailure({ error: error.message })))
        )
      )
    )
  );

  resetData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FormsActions.resetData),
      switchMap(() =>
        from(fetch('/assets/seed-forms.json')).pipe(
          switchMap(response => from(response.json())),
          switchMap(seedForms =>
            from(this.db.resetData(seedForms)).pipe(
              map(() => FormsActions.resetDataSuccess()),
              tap(() => location.reload())
            )
          ),
          catchError(error => of(FormsActions.loadFormsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private db: IndexedDBService
  ) { }
}

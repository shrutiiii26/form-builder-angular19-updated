import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeComponent } from './runtime.component';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [{ path: '', component: RuntimeComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class RuntimeModule { }

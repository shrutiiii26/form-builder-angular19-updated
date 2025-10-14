import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderComponent } from './builder.component';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [{ path: '', component: BuilderComponent }];

@NgModule({
  imports: [
    CommonModule,
    BuilderComponent,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule.forChild(routes)
  ]
})
export class BuilderModule { }

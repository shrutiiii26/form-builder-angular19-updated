import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubmissionsComponent } from './submissions.component';
import { RouterModule, Routes } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';

const routes: Routes = [{ path: '', component: SubmissionsComponent }];

@NgModule({
  declarations: [],
  imports: [CommonModule, ScrollingModule, RouterModule.forChild(routes)],
})
export class SubmissionsModule { }

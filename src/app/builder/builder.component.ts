import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadForms, resetData } from '../state/forms/forms.actions';
import { IndexedDBService } from '../core/services/indexeddb.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class BuilderComponent implements OnInit {
  schema: any = {
    title: 'New Form',
    pages: [{ id: 'page-1', title: 'Page 1', elements: [] }],
    rules: [],
    computed: []
  };

  currentPageIndex = 0;
  selectedElement: any = null;
  currentFormId: string | null = null;
  theme: any;

  constructor(private store: Store, private db: IndexedDBService, private themeService: ThemeService) {
    this.themeService.init();
  }

  ngOnInit() {
    this.store.dispatch(loadForms());
    this.loadExisting();
  }

  addField(type: string) {
    const id = 'f' + Date.now();
    const el: any = {
      id,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + ' Field',
      placeholder: '',
      required: false,
      disabled: false,
      validators: {}
    };

    if (type === 'select' || type === 'radio') {
      el.options = ['Option 1', 'Option 2', 'Option 3'];
      el.optionsText = el.options.join(', ');
    }

    this.schema.pages[this.currentPageIndex].elements.push(el);
  }

  selectElement(element: any) {
    this.selectedElement = element;
    if (element.options && !element.optionsText) {
      element.optionsText = element.options.join(', ');
    }
    if (!element.validators) {
      element.validators = {};
    }
  }

  updateOptions(el: any) {
    el.options = (el.optionsText || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  remove(i: number) {
    const removed = this.schema.pages[this.currentPageIndex].elements[i];
    if (this.selectedElement === removed) {
      this.selectedElement = null;
    }
    this.schema.pages[this.currentPageIndex].elements.splice(i, 1);
  }

  moveUp(i: number) {
    if (i > 0) {
      const elements = this.schema.pages[this.currentPageIndex].elements;
      [elements[i - 1], elements[i]] = [elements[i], elements[i - 1]];
    }
  }

  moveDown(i: number) {
    const elements = this.schema.pages[this.currentPageIndex].elements;
    if (i < elements.length - 1) {
      [elements[i], elements[i + 1]] = [elements[i + 1], elements[i]];
    }
  }

  async save() {
    try {
      let idToUse = this.currentFormId || ('form-' + Date.now());
      let createdAt = new Date().toISOString();

      if (this.currentFormId) {
        const existing = await this.db.getFormById(this.currentFormId);
        if (existing) {
          createdAt = existing.createdAt;
        }
      }

      const form = {
        id: idToUse,
        name: this.schema.title || 'Untitled',
        version: '1.0.0',
        schema: this.schema,
        createdAt,
        updatedAt: new Date().toISOString()
      };

      await this.db.saveForm(form);
      this.currentFormId = form.id;
      this.store.dispatch(loadForms());
      alert('Form saved successfully! ID: ' + form.id);
    } catch (e) {
      alert('Failed to save form');
    }
  }

  async loadExisting() {
    const forms = await this.db.getAllForms();
    if (forms && forms.length > 0) {
      const sorted = [...forms].sort((a: any, b: any) => {
        const au = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bu = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bu - au;
      });
      const form = sorted[0];
      this.schema = form.schema;
      this.currentFormId = form.id;
      this.currentPageIndex = 0;
      this.selectedElement = null;
    }
  }

  addPage() {
    const id = 'page-' + (this.schema.pages.length + 1);
    this.schema.pages.push({
      id,
      title: 'Page ' + (this.schema.pages.length + 1),
      elements: []
    });
  }

  addRule() {
    this.schema.rules.push({
      if: '',
      then: [{ action: 'show', target: '' }]
    });
  }

  removeRule(index: number) {
    this.schema.rules.splice(index, 1);
  }

  addComputed() {
    this.schema.computed.push({
      target: '',
      expr: '',
      dependencies: []
    });
  }

  removeComputed(index: number) {
    this.schema.computed.splice(index, 1);
  }

  resetDemo() {
    if (confirm('Are you sure you want to reset all data? This will clear all forms and submissions and reload seed data.')) {
      this.store.dispatch(resetData());
    }
  }

  toggleDarkMode() {
    console.log('jkbhj');

    this.themeService.toggleDarkMode();
  }
}

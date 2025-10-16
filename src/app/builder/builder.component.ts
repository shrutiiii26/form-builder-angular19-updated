import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadForms, resetData } from '../state/forms/forms.actions';
import { IndexedDBService } from '../core/services/indexeddb.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule]
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
  formVersions: any[] = [];
  showVersionHistory = false;
  
  // Field types for palette
  fieldTypes = [
    { type: 'text', label: 'Text', icon: '📝' },
    { type: 'textarea', label: 'Textarea', icon: '📄' },
    { type: 'number', label: 'Number', icon: '🔢' },
    { type: 'date', label: 'Date', icon: '📅' },
    { type: 'select', label: 'Select', icon: '📋' },
    { type: 'radio', label: 'Radio', icon: '🔘' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'file', label: 'File', icon: '📎' }
  ];
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
      await this.loadFormVersions();
    }
  }

  async loadFormVersions() {
    if (this.currentFormId) {
      this.formVersions = await this.db.getFormVersions(this.currentFormId);
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

  // Drag and drop handlers
  dropField(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  dropFromPalette(event: CdkDragDrop<any[]>) {
    const fieldType = event.item.data;
    const newField = this.createField(fieldType.type);
    event.container.data.splice(event.currentIndex, 0, newField);
  }

  private createField(type: string): any {
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

    return el;
  }

  // Keyboard navigation for accessibility
  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      this.moveUp(index);
    } else if (event.key === 'ArrowDown' && index < this.schema.pages[this.currentPageIndex].elements.length - 1) {
      event.preventDefault();
      this.moveDown(index);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.remove(index);
    }
  }

  async bumpVersion() {
    if (!this.currentFormId) return;
    try {
      const newVersion = await this.db.bumpVersion(this.currentFormId);
      await this.loadFormVersions();
      alert(`Version bumped to ${newVersion}`);
    } catch (e) {
      alert('Failed to bump version');
    }
  }

  async revertToVersion(version: string) {
    if (!this.currentFormId) return;
    if (!confirm(`Are you sure you want to revert to version ${version}?`)) return;
    
    try {
      await this.db.revertToVersion(this.currentFormId, version);
      await this.loadExisting();
      alert(`Reverted to version ${version}`);
    } catch (e) {
      alert('Failed to revert version');
    }
  }

  toggleVersionHistory() {
    this.showVersionHistory = !this.showVersionHistory;
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IndexedDBService } from '../core/services/indexeddb.service';

@Component({
  selector: 'app-runtime',
  templateUrl: './runtime.component.html',
})
export class RuntimeComponent implements OnInit, OnDestroy {
  formSchema: any;
  fg: FormGroup = new FormGroup({});
  currentPageIndex = 0;
  hiddenFields: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private db: IndexedDBService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || 'form-1';
    await this.loadForm(id);
  }

  ngOnDestroy() {
  }

  async loadForm(id: string) {
    const forms = await this.db.getAllForms();
    this.formSchema = forms.find((f: any) => f.id === id);

    if (!this.formSchema && forms.length > 0) {
      this.formSchema = forms[0];
    }

    if (this.formSchema) {
      this.buildForm();
      this.setupRulesAndComputed();
    }
  }

  buildForm() {
    const controls: any = {};
    this.formSchema.schema.pages.forEach((page: any) => {
      page.elements.forEach((el: any) => {
        const validators = this.getValidators(el);
        const defaultValue = this.getDefaultValue(el);
        controls[el.id] = new FormControl(
          { value: defaultValue, disabled: el.disabled },
          validators
        );
      });
    });

    this.fg = new FormGroup(controls);
  }

  getValidators(element: any): any[] {
    const validators: any[] = [];

    if (element.required) {
      validators.push(Validators.required);
    }

    if (element.validators) {
      if (element.validators.minLength) {
        validators.push(Validators.minLength(element.validators.minLength));
      }
      if (element.validators.maxLength) {
        validators.push(Validators.maxLength(element.validators.maxLength));
      }
      if (element.validators.min !== undefined) {
        validators.push(Validators.min(element.validators.min));
      }
      if (element.validators.max !== undefined) {
        validators.push(Validators.max(element.validators.max));
      }
      if (element.validators.pattern) {
        validators.push(Validators.pattern(element.validators.pattern));
      }
    }

    return validators;
  }

  getDefaultValue(element: any): any {
    if (element.type === 'checkbox') {
      return false;
    }
    if (element.type === 'number') {
      return null;
    }
    return element.default || '';
  }

  setupRulesAndComputed() {
    this.fg.valueChanges.subscribe((values) => {
      this.evaluateRules(values);
      this.evaluateComputed(values);
    });
    this.evaluateRules(this.fg.value);
    this.evaluateComputed(this.fg.value);
  }

  evaluateRules(values: any) {
    if (!this.formSchema.schema.rules || this.formSchema.schema.rules.length === 0) {
      return;
    }

    this.formSchema.schema.rules.forEach((rule: any) => {
      try {

        let condition = rule.if;

        Object.keys(values).forEach(key => {
          const value = values[key];
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          const replacement = typeof value === 'string' ? `'${value}'` : String(value);
          condition = condition.replace(regex, replacement);
        });

        const result = this.safeEvaluate(condition);

        if (rule.then && Array.isArray(rule.then)) {
          rule.then.forEach((action: any) => {
            this.applyAction(action, result);
          });
        }
      } catch (error) {
        console.error('Error evaluating rule:', rule, error);
      }
    });
  }

  safeEvaluate(expression: string): boolean {
    try {
      return Boolean(Function(`'use strict'; return (${expression})`)());
    } catch {
      return false;
    }
  }

  applyAction(action: any, conditionResult: boolean) {
    const control = this.fg.get(action.target);

    if (!control) return;

    switch (action.action) {
      case 'show':
        this.hiddenFields[action.target] = !conditionResult;
        break;
      case 'hide':
        this.hiddenFields[action.target] = conditionResult;
        break;
      case 'enable':
        if (conditionResult) {
          control.enable();
        }
        break;
      case 'disable':
        if (conditionResult) {
          control.disable();
        }
        break;
      case 'setValue':
        if (conditionResult && action.value !== undefined) {
          control.setValue(action.value, { emitEvent: false });
        }
        break;
    }
  }

  evaluateComputed(values: any) {
    if (!this.formSchema.schema.computed || this.formSchema.schema.computed.length === 0) {
      return;
    }

    this.formSchema.schema.computed.forEach((computed: any) => {
      try {
        let expression = computed.expr;
        Object.keys(values).forEach(key => {
          const value = values[key] || 0;
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          expression = expression.replace(regex, String(value));
        });
        const result = this.safeEvaluateExpression(expression);
        const control = this.fg.get(computed.target);
        if (control) {
          control.setValue(result, { emitEvent: false });
        }
      } catch (error) {
        console.error('Error evaluating computed field:', computed, error);
      }
    });
  }

  safeEvaluateExpression(expression: string): any {
    try {
      return Function(`'use strict'; return (${expression})`)();
    } catch {
      return null;
    }
  }

  nextPage() {
    if (this.currentPageIndex < this.formSchema.schema.pages.length - 1) {
      this.currentPageIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  saveDraft() {
    localStorage.setItem(
      `form-draft-${this.formSchema.id}`,
      JSON.stringify({
        values: this.fg.value,
        pageIndex: this.currentPageIndex,
        savedAt: new Date().toISOString()
      })
    );
    alert('Draft saved locally!');
  }

  loadDraft() {
    const draftKey = `form-draft-${this.formSchema.id}`;
    const draft = localStorage.getItem(draftKey);

    if (draft) {
      try {
        const { values, pageIndex } = JSON.parse(draft);
        this.fg.patchValue(values);
        this.currentPageIndex = pageIndex || 0;
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }

  async submit() {
    if (this.fg.invalid) {
      this.markAllAsTouched();
      alert('Please fill in all required fields correctly.');
      return;
    }

    const submission = {
      id: 's-' + Date.now(),
      formId: this.formSchema.id,
      formVersion: this.formSchema.version,
      data: this.fg.value,
      createdAt: new Date().toISOString()
    };

    try {
      await this.db.saveSubmission(submission);
      localStorage.removeItem(`form-draft-${this.formSchema.id}`);

      alert('Form submitted successfully! Submission ID: ' + submission.id);
      this.fg.reset();
      this.currentPageIndex = 0;
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  }

  markAllAsTouched() {
    Object.keys(this.fg.controls).forEach(key => {
      this.fg.get(key)?.markAsTouched();
    });
  }

  onFileChange(event: any, fieldId: string) {
    const file = event.target.files[0];
    if (file) {
      const control = this.fg.get(fieldId);
      if (control) {
        control.setValue(file.name);
      }
    }
  }
}

import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface FormSchema {
  id: string;
  name: string;
  version: string;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  formId: string;
  formVersion: string;
  data: any;
  createdAt: string;
}

export interface AuditLog {
  id?: number;
  formId: string;
  action: string;
  payload: any;
  at: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService extends Dexie {
  getForms() {
    throw new Error('Method not implemented.');
  }
  forms!: Table<FormSchema, string>;
  submissions!: Table<Submission, string>;
  audit!: Table<AuditLog, number>;

  constructor() {
    super('FormBuilderDB');

    this.version(1).stores({
      forms: 'id, name, version, createdAt, updatedAt',
      submissions: 'id, formId, formVersion, createdAt',
      audit: '++id, formId, action, at'
    });

    // Initialize table references
    this.forms = this.table('forms');
    this.submissions = this.table('submissions');
    this.audit = this.table('audit');

    // Seed initial data on first run (non-blocking)
    this.initializeSeedData();
  }

  private async initializeSeedData(): Promise<void> {
    try {
      const existingForms = await this.forms.count();
      if (existingForms === 0) {
        const response = await fetch('/assets/seed-forms.json');
        const seedForms: FormSchema[] = await response.json();
        await this.seedData(seedForms);
      }
    } catch (error) {
      // Swallow seeding errors to avoid breaking app bootstrap, but log for diagnostics
      console.error('Failed to initialize seed data:', error);
    }
  }

  async seedData(seedForms: FormSchema[]): Promise<void> {
    const existingForms = await this.forms.count();

    if (existingForms === 0) {
      await this.forms.bulkAdd(seedForms);

      // Add audit log for seeding
      await this.audit.add({
        formId: 'system',
        action: 'seed',
        payload: { count: seedForms.length },
        at: new Date().toISOString()
      });
    }
  }

  async getAllForms(): Promise<FormSchema[]> {
    return await this.forms.toArray();
  }

  async getFormById(id: string): Promise<FormSchema | undefined> {
    return await this.forms.get(id);
  }

  async saveForm(form: FormSchema): Promise<string> {
    await this.forms.put(form);

    await this.audit.add({
      formId: form.id,
      action: 'update',
      payload: form,
      at: new Date().toISOString()
    });

    return form.id;
  }

  async createForm(form: FormSchema): Promise<string> {
    await this.forms.add(form);

    await this.audit.add({
      formId: form.id,
      action: 'create',
      payload: form,
      at: new Date().toISOString()
    });

    return form.id;
  }

  async deleteForm(id: string): Promise<void> {
    await this.forms.delete(id);

    await this.audit.add({
      formId: id,
      action: 'delete',
      payload: { id },
      at: new Date().toISOString()
    });
  }

  async getSubmissions(formId: string): Promise<Submission[]> {
    return await this.submissions
      .where('formId')
      .equals(formId)
      .toArray();
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await this.submissions.toArray();
  }

  async saveSubmission(submission: Submission): Promise<string> {
    await this.submissions.add(submission);

    await this.audit.add({
      formId: submission.formId,
      action: 'submission',
      payload: submission,
      at: new Date().toISOString()
    });

    return submission.id;
  }

  async getAuditLogs(formId?: string): Promise<AuditLog[]> {
    if (formId) {
      return await this.audit
        .where('formId')
        .equals(formId)
        .toArray();
    }
    return await this.audit.toArray();
  }

  async resetData(seedForms: FormSchema[]): Promise<void> {
    await this.forms.clear();
    await this.submissions.clear();
    await this.audit.clear();

    await this.seedData(seedForms);
  }

  async getFormVersions(formId: string): Promise<AuditLog[]> {
    return await this.audit
      .where('formId')
      .equals(formId)
      .and(log => log.action === 'update' || log.action === 'create')
      .toArray();
  }
}

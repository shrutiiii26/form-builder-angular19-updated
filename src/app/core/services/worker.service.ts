import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface WorkerMessage {
  type: 'COMPUTE' | 'EVALUATE_RULE';
  payload: any;
}

export interface WorkerResponse {
  type: string;
  result: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerService {

  async evaluateIf(condition: string, context: any): Promise<boolean> {
    if (this.worker) {
      return new Promise<boolean>((resolve) => {
        const sub = this.messages$.subscribe(msg => {
          if (msg.type === 'EVALUATE_RULE_RESULT') {
            sub.unsubscribe();
            resolve(Boolean(msg.result));
          } else if (msg.type === 'ERROR') {
            sub.unsubscribe();
            resolve(false);
          }
        });
        this.postMessage({ type: 'EVALUATE_RULE', payload: { condition, context } });
      });
    }

    try {
      return this.evaluateRule(condition, context);
    } catch {
      return false;
    }
  }
  private worker?: Worker;
  private messageSubject = new Subject<WorkerResponse>();
  public messages$ = this.messageSubject.asObservable();

  constructor() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../../workers/expression.worker', import.meta.url), {
          type: 'module'
        });

        this.worker.onmessage = ({ data }) => {
          this.messageSubject.next(data);
        };

        this.worker.onerror = (error) => {
          console.error('Worker error:', error);
          this.messageSubject.next({
            type: 'ERROR',
            result: null,
            error: error.message
          });
        };
      } catch (e) {
        console.warn('Web Worker not available:', e);
      }
    } else {
      console.warn('Web Workers are not supported in this environment.');
    }
  }

  postMessage(message: WorkerMessage): void {
    if (this.worker) {
      this.worker.postMessage(message);
    } else {
      this.computeOnMainThread(message);
    }
  }

  private computeOnMainThread(message: WorkerMessage): void {
    try {
      let result: any;

      if (message.type === 'COMPUTE') {
        result = this.evaluateExpression(message.payload.expr, message.payload.context);
      } else if (message.type === 'EVALUATE_RULE') {
        result = this.evaluateRule(message.payload.condition, message.payload.context);
      }

      this.messageSubject.next({
        type: message.type + '_RESULT',
        result
      });
    } catch (error: any) {
      this.messageSubject.next({
        type: 'ERROR',
        result: null,
        error: error.message
      });
    }
  }

  private evaluateExpression(expr: string, context: any): any {
    let expression = expr;

    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expression = expression.replace(regex, String(value));
    }
    try {
      return Function(`"use strict"; return (${expression})`)();
    } catch {
      return null;
    }
  }

  private evaluateRule(condition: string, context: any): boolean {
    let expression = condition;

    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      const val = typeof value === 'string' ? `'${value}'` : String(value);
      expression = expression.replace(regex, val);
    }

    try {
      return Boolean(Function(`"use strict"; return (${expression})`)());
    } catch {
      return false;
    }
  }

  async evaluateCompute(expr: string, context: any): Promise<{ success: boolean; result: any }> {
    if (this.worker) {
      return new Promise(resolve => {
        const sub = this.messages$.subscribe(msg => {
          if (msg.type === 'COMPUTE_RESULT') {
            sub.unsubscribe();
            resolve({ success: true, result: msg.result });
          } else if (msg.type === 'ERROR') {
            sub.unsubscribe();
            resolve({ success: false, result: null });
          }
        });
        this.postMessage({ type: 'COMPUTE', payload: { expr, context } });
      });
    }

    try {
      const result = this.evaluateExpression(expr, context);
      return { success: true, result };
    } catch (err) {
      return { success: false, result: null };
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  private syntheticInterval?: number;
  private isGenerating = false;

  startSyntheticGeneration(intervalMs: number = 5000): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.syntheticInterval = window.setInterval(() => {
      this.generateSyntheticSubmission();
    }, intervalMs);
  }

  stopSyntheticGeneration(): void {
    if (this.syntheticInterval) {
      clearInterval(this.syntheticInterval);
      this.syntheticInterval = undefined;
    }
    this.isGenerating = false;
  }

  private generateSyntheticSubmission(): void {
    const syntheticData = {
      name: this.randomName(),
      email: this.randomEmail(),
      age: Math.floor(Math.random() * 50) + 18,
      department: this.randomDepartment(),
      salary: Math.floor(Math.random() * 100000) + 30000,
      startDate: this.randomDate(),
      skills: this.randomSkills(),
      rating: Math.floor(Math.random() * 5) + 1
    };

    this.messageSubject.next({
      type: 'SYNTHETIC_SUBMISSION',
      result: syntheticData
    });
  }

  private randomName(): string {
    const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private randomEmail(): string {
    const domains = ['example.com', 'test.org', 'demo.net'];
    const name = this.randomName().toLowerCase().replace(' ', '.');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${name}@${domain}`;
  }

  private randomDepartment(): string {
    const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
    return depts[Math.floor(Math.random() * depts.length)];
  }

  private randomDate(): string {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  private randomSkills(): string[] {
    const skills = ['JavaScript', 'TypeScript', 'Angular', 'React', 'Node.js', 'Python', 'Java', 'C#'];
    const count = Math.floor(Math.random() * 3) + 1;
    return skills.sort(() => 0.5 - Math.random()).slice(0, count);
  }
}

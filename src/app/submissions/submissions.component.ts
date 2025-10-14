import { Component, OnInit } from '@angular/core';
import { IndexedDBService } from '../core/services/indexeddb.service';
import { ScrollingModule } from "@angular/cdk/scrolling";

@Component({
  selector: 'app-submissions',
  template: `
    <div>
      <h2>Submissions</h2>
      <button (click)="generateMock()">Generate 1000 mock</button>
      <button (click)="exportCsv()">Export CSV</button>
      <cdk-virtual-scroll-viewport itemSize="50" style="height:400px; border:1px solid #ddd;">
        <div *cdkVirtualFor="let s of submissions">
          <div style="padding:8px; border-bottom:1px solid #eee;">
            <strong>{{s.id}}</strong> - {{s.formId}} - {{s.createdAt}}
            <pre>{{s.data | json}}</pre>
          </div>
        </div>
      </cdk-virtual-scroll-viewport>
    </div>
  `,
  imports: [ScrollingModule]
})
export class SubmissionsComponent implements OnInit {
  submissions: any[] = [];

  constructor(private db: IndexedDBService) { }

  async ngOnInit() {
    this.submissions = await this.db.submissions.toArray();
  }

  async generateMock() {
    for (let i = 0; i < 1000; i++) {
      await this.db.saveSubmission({ id: 'mock-' + Date.now() + '-' + i, formId: 'form-1', formVersion: '1.0.0', data: { v: i }, createdAt: new Date().toISOString() });
    }
    this.submissions = await this.db.submissions.toArray();
  }

  exportCsv() {
    const headers = ['id', 'formId', 'formVersion', 'createdAt', 'data'];
    const rows = this.submissions.map(s => [s.id, s.formId, s.formVersion, s.createdAt, JSON.stringify(s.data)]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'submissions.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

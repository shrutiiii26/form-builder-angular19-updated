import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IndexedDBService, Submission } from '../core/services/indexeddb.service';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScrollingModule, FormsModule]
})
export class SubmissionsComponent implements OnInit {
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  formId: string | null = null;
  searchTerm = '';
  dateFilter = '';

  constructor(
    private route: ActivatedRoute,
    private db: IndexedDBService
  ) {}

  async ngOnInit() {
    this.formId = this.route.snapshot.paramMap.get('id');
    await this.loadSubmissions();
  }

  async loadSubmissions() {
    if (this.formId) {
      this.submissions = await this.db.getSubmissions(this.formId);
    } else {
      this.submissions = await this.db.getAllSubmissions();
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filteredSubmissions = this.submissions.filter(sub => {
      const matchesSearch = !this.searchTerm || 
        JSON.stringify(sub.data).toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDate = !this.dateFilter || 
        new Date(sub.createdAt).toDateString() === new Date(this.dateFilter).toDateString();
      return matchesSearch && matchesDate;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onDateChange() {
    this.applyFilters();
  }

  exportToCSV() {
    if (this.filteredSubmissions.length === 0) return;

    const headers = ['ID', 'Form ID', 'Created At', 'Data'];
    const csvContent = [
      headers.join(','),
      ...this.filteredSubmissions.map(sub => [
        sub.id,
        sub.formId,
        sub.createdAt,
        `"${JSON.stringify(sub.data).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-${this.formId || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  trackBySubmission(index: number, submission: Submission): string {
    return submission.id;
  }
}
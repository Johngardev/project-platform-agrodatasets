import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DatasetCardComponent } from '../../../../shared/components/dataset-card/dataset-card.component';
import { DatasetService } from '../../../../core/services/dataset.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, StatCardComponent, DatasetCardComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent implements OnInit {
  datasetService = inject(DatasetService);
  datasets: any[] = [];

  ngOnInit() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets = data;
    });
  }
}

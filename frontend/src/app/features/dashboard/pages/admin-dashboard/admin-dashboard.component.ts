import { Component, inject } from '@angular/core';
import { DatasetCardComponent } from '../../../../shared/components/dataset-card/dataset-card.component';
import { DatasetService } from '../../../../core/services/dataset.service';
import { RouterLink } from "@angular/router";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatasetCardComponent, RouterLink, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  datasetService = inject(DatasetService);
  datasets: any[] = [];

  ngOnInit() {
    this.datasetService.getDatasets().subscribe(data => {
      this.datasets = data;
    });
  }  
}

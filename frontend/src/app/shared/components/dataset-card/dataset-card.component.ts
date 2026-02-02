import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dataset-card',
  standalone: true,
  imports: [],
  templateUrl: './dataset-card.component.html',
  styleUrl: './dataset-card.component.css'
})
export class DatasetCardComponent {
  @Input() title!: string;
  @Input() uploader!: string;
  @Input() date!: string;
  @Input() imageUrl!: string; // URL de la imagen (puede ser local o remota)
  @Input() year!: string;
  @Input() imageCount!: string;
}

import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.css'
})
export class UploadPageComponent {
  file = signal<File | null>(null);
  progress = signal<number>(0);
  logs = signal<string[]>([]);
  currentStep = signal<number>(0); // 0: Idle, 1: Integrity, 2: Decompress, 3: Format, 4: Done

  isDragging = signal(false);
  fileSize = '0 MB';
  timeRemaining = 'Calculando...';

  // -- Manejo de Drag & Drop --
  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  // -- Lógica de Simulación de Carga --
  handleFile(file: File) {
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      alert('Solo se permiten archivos .zip');
      return;
    }

    this.file.set(file);
    this.fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    this.simulateUploadProcess();
  }

  simulateUploadProcess() {
    this.addLog('System: Upload initialized');
    this.currentStep.set(1);
    
    // Simular progreso
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5;
      if (p > 100) p = 100;
      this.progress.set(Math.floor(p));

      // Simular etapas basado en el progreso
      if (p > 20 && this.currentStep() === 1) {
         this.addLog('Integrity: Checksum OK (MD5 verified)');
         this.currentStep.set(2);
      }
      if (p > 60 && this.currentStep() === 2) {
         this.addLog('Unzip: Started worker process #492');
         this.addLog('Unzip: Completed in 3.2s');
         this.currentStep.set(3);
      }
      if (p >= 100) {
        clearInterval(interval);
        this.addLog('> Checking MIME types...');
        this.addLog('<span class="text-green-400">SUCCESS: Dataset ready for review.</span>');
        this.currentStep.set(4);
        this.timeRemaining = 'Completado';
      } else {
        this.timeRemaining = `${Math.floor((100 - p) / 10)} segundos restantes`;
      }
    }, 200);
  }

  cancelUpload() {
    this.file.set(null);
    this.progress.set(0);
    this.logs.set([]);
    this.currentStep.set(0);
  }

  private addLog(msg: string) {
    this.logs.update(l => [...l, `${new Date().toISOString()} ${msg}`]);
  }

  // -- Helpers para la UI del Checklist --
  getStepClass(step: number) {
    if (this.currentStep() > step) return 'bg-primary/20 text-primary'; // Completado
    if (this.currentStep() === step) return 'bg-primary text-white animate-pulse'; // En progreso
    return 'bg-surface-dark-highlight border border-border-dark text-text-secondary-dark'; // Pendiente
  }

  getStepIcon(step: number) {
    if (this.currentStep() > step) return 'check';
    if (this.currentStep() === step) return 'sync'; // Icono girando
    return 'radio_button_unchecked';
  }

  getStepStatusText(step: number) {
    if (this.currentStep() > step) return 'Passed';
    if (this.currentStep() === step) return 'Processing...';
    return 'Pending...';
  }

  getStepTextClass(step: number) {
    if (this.currentStep() > step) return 'text-primary';
    if (this.currentStep() === step) return 'text-white';
    return 'text-text-secondary-dark opacity-50';
  }

}

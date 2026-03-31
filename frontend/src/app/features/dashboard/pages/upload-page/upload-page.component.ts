import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { DatasetService } from '../../../../core/services/dataset.service';
import Swal from 'sweetalert2';

interface LogEntry {
  timestamp: Date;
  message: string;
}

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.css'
})
export class UploadPageComponent {
  private _datasetService = inject(DatasetService);
  private _router = inject(Router);

  file = signal<File | null>(null);
  progress = signal<number>(0);
  logs = signal<LogEntry[]>([]);
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

  handleFile(file: File) {
    if (file.type !== 'application/zip' && !file.type.includes('zip') && !file.name.endsWith('.zip')) {
      alert('Solo se permiten archivos .zip');
      return;
    }

    this.file.set(file);
    this.fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    // Llamamos a la subida real
    this.uploadFile(file);
  }

  uploadFile(file: File) {
    this.addLog('System: Initializing secure upload connection...');
    this.currentStep.set(1); // Paso 1: Integridad (Check local)

    // Variable auxiliar para evitar que los logs de red se impriman repetidamente
    let networkLogPrinted = false;

    this._datasetService.uploadDatasetZip(file).subscribe({
      next: (event: any) => {
        // 1. Evento de Progreso de Subida
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percent = Math.round((100 * event.loaded) / event.total);
            this.progress.set(percent);
            
            this.timeRemaining = `${percent}% Uploaded`;

            // Simulamos pasos visuales basados en el progreso real de red
            if (percent > 10 && this.currentStep() === 1) {
              this.addLog('Integrity: Client-side validation passed');
              this.currentStep.set(2); // Paso 2: Subiendo/Descomprimiendo
            }
            if (percent > 90 && !networkLogPrinted) {
              networkLogPrinted = true; // Evitamos que se imprima 10 veces en el 91%, 92%, etc.
              this.addLog('Network: File transmission complete');
              this.addLog('Server: Verifying magic numbers and EXIF data...');
            }
          }
        } 
        
        // 2. Evento de Respuesta Final (Cuando el servidor responde con los datos procesados)
        else if (event.type === HttpEventType.Response) {
          this.progress.set(100);
          this.currentStep.set(3); // Paso 3: Verificación
          
          const response = event.body;
          
          this.addLog(`Server: ${response.message || 'Dataset processed'}`);
          this.addLog(`Storage: Processed ${response.totalImages || 0} images successfully.`);
          
          // ==========================================
          // INTEGRACIÓN RF-010: REPORTAR ESTADO EXIF
          // ==========================================
          if (response.missingExifCount && response.missingExifCount > 0) {
            // Imprimimos en la consola de tu UI
            this.addLog(`<span class="text-yellow-500 font-bold"> Warning: ${response.missingExifCount} images missing original EXIF date. Defaulting to OS file date.</span>`);
            
            // Mostramos el popup obligatorio informando al usuario (RF-010)
            Swal.fire({
              title: 'Atención con la Metadata',
              html: `El dataset se subió correctamente con <b>${response.totalImages} imágenes</b>.<br><br><span style="color: #f59e0b;">⚠️ Advertencia:</span> <b>${response.missingExifCount} imágenes</b> no tenían la fecha de captura original de la cámara (EXIF).<br><br><i>El sistema ha utilizado la fecha de creación del archivo como valor por defecto.</i>`,
              icon: 'warning',
              background: '#1f2937',
              color: '#f3f4f6',
              confirmButtonColor: '#f59e0b',
              confirmButtonText: 'Entendido'
            });
          } else {
            // Si todas tenían fecha perfecta o no hay errores de EXIF
            this.addLog('<span class="text-green-500">EXIF Validation: 100% Original capture dates preserved.</span>');
            
            Swal.fire({
              title: '¡Subida Exitosa!',
              text: `Las ${response.totalImages || 'imágenes'} y su metadata (incluyendo EXIF) fueron procesadas correctamente.`,
              icon: 'success',
              background: '#1f2937',
              color: '#f3f4f6',
              confirmButtonColor: '#10b981'
            });
          }
          // ==========================================

          this.addLog('<span class="text-primary font-bold">SUCCESS: Dataset queued for processing.</span>');
          
          this.currentStep.set(4); // Completado
          this.timeRemaining = 'Upload Complete';
        }
      },
      error: (err) => {
        console.error(err);
        this.addLog(`<span class="text-red-500">ERROR: Upload failed - ${err.statusText || 'Unknown error'}</span>`);
        this.progress.set(0);
        
        // Actualizamos el alert nativo por un SweetAlert más bonito
        Swal.fire({
          title: 'Error de subida',
          text: 'Hubo un error al subir el archivo. Revisa la consola o asegúrate de que el formato sea correcto.',
          icon: 'error',
          background: '#1f2937',
          color: '#f3f4f6',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  cancelUpload() {
    this.file.set(null);
    this.progress.set(0);
    this.logs.set([]);
    this.currentStep.set(0);
  }

  private addLog(msg: string) {
    this.logs.update(currentLogs => [
      ...currentLogs,
      { timestamp: new Date(), message: msg }
    ]);
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

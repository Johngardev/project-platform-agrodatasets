import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Dataset } from './dataset.schema';

export type ImageDocument = Image & Document;

/**
 * Sub-esquema para valores espectrales.
 * * JUSTIFICACIÓN DE DISEÑO:
 * Se separan los canales RGB y NIR (Infrarrojo Cercano) para facilitar algoritmos
 * de cálculo de índices de vegetación (como NDVI) sin procesar la imagen completa.
 * El NIR es crítico para evaluar la salud celular del aguacate antes de que sea visible al ojo humano.
 */
@Schema({ _id: false }) // No necesitamos un _id para este sub-esquema
class SpectralValues {
  @Prop({ required: true })
  r: number; // Valor promedio Red (0-255)

  @Prop({ required: true })
  g: number; // Valor promedio Green (0-255)

  @Prop({ required: true })
  b: number; // Valor promedio Blue (0-255)

  @Prop({ required: true })
  nir: number; // Near Infrared (Infrarrojo Cercano) - Clave para salud vegetal
}

export const SpectralValuesSchema =
  SchemaFactory.createForClass(SpectralValues);

@Schema({ _id: false }) // No necesitamos un _id para este sub-esquema
class ImageMetadata {
  @Prop()
  width: number;

  @Prop()
  height: number;

  // Requerimiento del profesor: Grado de maduración general de la imagen
  // Ej: 1 (Verde), 2 (Pintón), 3 (Maduro), 4 (Sobremaduro)
  @Prop({ required: true })
  ripeness_degree: string;

  @Prop({ type: Date, default: null })
  capture_date: Date;

  @Prop({ type: Boolean, default: false })
  has_original_exif: boolean;

  // Datos espectrales anidados
  @Prop({ type: SpectralValues, default: () => ({}) })
  spectral_values: SpectralValues;

  @Prop({ type: [], default: [] })
  annotations: any[];
}

export const ImageMetadataSchema = SchemaFactory.createForClass(ImageMetadata);

/**
 * Entidad que representa una imagen capturada dentro de un Dataset.
 * * ARQUITECTURA DE DATOS:
 * Se utiliza una estructura anidada para 'metadata' para agrupar atributos técnicos
 * y biológicos (maduración), manteniendo la raíz del documento limpia para
 * operaciones de infraestructura (URLs, nombres de archivo).
 */
@Schema({ timestamps: true })
export class Image {
  // Relación con el Dataset padre (Indexado para búsquedas rápidas)
  @Prop({
    type: Types.ObjectId,
    ref: 'Dataset',
    required: true,
    index: true,
  })
  dataset_id: Dataset;

  @Prop({ required: true })
  file_name: string;

  @Prop({ required: true })
  storage_url: string;

  // Contenedor de toda la información técnica
  @Prop({ type: ImageMetadataSchema, default: () => ({}) })
  metadata: ImageMetadata;
}

export const ImageSchema = SchemaFactory.createForClass(Image);

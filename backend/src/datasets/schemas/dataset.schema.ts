import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type DatasetDocument = Dataset & Document;

export enum DatasetStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Dataset {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  uploaded_by: User;

  // Control de Estado del Dataset
  @Prop({ default: DatasetStatus.PENDING, enum: DatasetStatus })
  status: string;

  // Solo se llena si es rechazado
  @Prop({ type: String, default: null })
  rejection_reason: string | null;

  // Contador de imágenes
  @Prop({ default: 0 })
  image_count: number;

  // Campo fijo
  @Prop({ default: 'Hass Avocado', immutable: true })
  crop_type: string;
}

export const DatasetSchema = SchemaFactory.createForClass(Dataset);

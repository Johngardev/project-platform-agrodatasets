import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DatasetStatus } from '../schemas/dataset.schema'; // Asegúrate de que la ruta al Enum sea correcta

export class UpdateDatasetStatusDto {
  @IsEnum(DatasetStatus, {
    message: 'El estado debe ser PENDING, APPROVED o REJECTED',
  })
  status: DatasetStatus;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

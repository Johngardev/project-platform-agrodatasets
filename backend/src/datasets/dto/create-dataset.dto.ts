import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDatasetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Aunque el esquema tiene default 'Hass Avocado', permitimos enviarlo si validamos
  @IsString()
  @IsOptional()
  crop_type?: string;

  // Nota: No se incluye 'status', 'rejection_reason' ni 'uploaded_by'
  // porque el usuario no debe decidir eso al crear.
}

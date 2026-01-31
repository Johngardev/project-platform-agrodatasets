import {
  IsString,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// 1. DTO para los valores espectrales (Validamos rangos)
class SpectralValuesDto {
  @IsNumber()
  @Min(0)
  @Max(255)
  r: number;

  @IsNumber()
  @Min(0)
  @Max(255)
  g: number;

  @IsNumber()
  @Min(0)
  @Max(255)
  b: number;

  @IsNumber()
  nir: number; // El rango del NIR depende del sensor, lo dejamos abierto pero numérico
}

// 2. DTO para la metadata
class ImageMetadataDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsString()
  @IsNotEmpty()
  ripeness_degree: string; // Ej: "Maduro"

  @ValidateNested()
  @Type(() => SpectralValuesDto) // ¡Importante para validar objetos anidados!
  spectral_values: SpectralValuesDto;

  @IsArray()
  @IsOptional()
  annotations?: any[]; // Flexible array de objetos
}

//DTO Principal de Creación
export class CreateImageDto {
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @IsString()
  @IsNotEmpty()
  storage_url: string; // URL de S3 o Cloudinary

  @ValidateNested()
  @Type(() => ImageMetadataDto) // ¡Clave para que funcione!
  metadata: ImageMetadataDto;
}

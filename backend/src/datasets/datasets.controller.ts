/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateImageDto } from './dto/create-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // 1. Solo usuarios autenticados
  create(@Body() createDatasetDto: CreateDatasetDto, @Req() req: any) {
    //Obtenemos el ID del usuario desde el Token decodificado
    const userId = req.user.userId;

    //Llamamos al servicio pasando los datos y el ID del dueño
    return this.datasetsService.create(createDatasetDto, userId);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  async addImage(
    @Param('id') id: string,
    @Body() createImageDto: CreateImageDto,
  ) {
    return this.datasetsService.addImage(id, createImageDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `dataset-${uniqueSuffix}${ext}`);
        },
      }),
      // Opcional: Filtro previo de multer (más seguro, evita guardar si no es zip)
      fileFilter: (req, file, callback) => {
        // Aceptamos cualquier cosa que parezca un zip, rar o 7z
        if (!file.originalname.match(/\.(zip|rar|7z)$/)) {
          // Si quieres ser estricto descomenta la siguiente línea:
          // return callback(new Error('Solo se permiten archivos ZIP'), false);
        }
        callback(null, true);
      },
    }),
  )
  uploadDataset(@UploadedFile() file: Express.Multer.File) {
    // 1. Verificamos que el archivo haya llegado
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    // 2. IMPRIMIR EN CONSOLA EL TIPO REAL (Para depurar)
    console.log('✅ Archivo recibido correctamente:', file.filename);
    console.log('ℹ️ Tipo MIME detectado:', file.mimetype);

    // 3. Validar manualmente (Opcional, pero recomendado)
    // Si quieres bloquear tipos raros, puedes descomentar esto:
    /*
    const allowedMimeTypes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
       // Aquí podrías borrar el archivo si no es válido
       throw new BadRequestException(`Tipo de archivo no válido: ${file.mimetype}`);
    }
    */

    return this.datasetsService.processDataset(file);
  }

  @Get()
  findAll() {
    return this.datasetsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatasetDto: UpdateDatasetDto) {
    return this.datasetsService.update(+id, updateDatasetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasetsService.remove(+id);
  }
}

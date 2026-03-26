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
  Query,
} from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateImageDto } from './dto/create-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateDatasetStatusDto } from './dto/update-dataset-status.dto';

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/images', // Asegúrate de que esta carpeta exista
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `img-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async addImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('metadata') metadataString: string, // El frontend manda un string JSON
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    // 1. Parseamos la metadata que viene como string desde el FormData de Angular
    const metadata = metadataString ? JSON.parse(metadataString) : {};

    // 2. Construimos el DTO manualmente con los datos del archivo guardado
    const createImageDto: CreateImageDto = {
      file_name: file.filename,
      storage_url: file.path, // La ruta donde se guardó
      metadata: metadata,
    };

    // 3. Llamamos a tu servicio que ya hace la magia en la BD
    return this.datasetsService.addImage(id, createImageDto);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard) // Solo usuarios autenticados pueden subir datasets
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
  uploadDataset(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    const userId = req.user.userId;
    return this.datasetsService.processDataset(file, userId);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    // Ejemplo de uso desde Angular: GET /datasets?status=PENDING
    return this.datasetsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasetsService.findOne(id);
  }

  @Patch(':id/status')
  // @UseGuards(JwtAuthGuard, RolesGuard) // Opcional: Proteger para que solo Admin lo use
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDatasetStatusDto,
  ) {
    return this.datasetsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatasetDto: UpdateDatasetDto) {
    return this.datasetsService.update(id, updateDatasetDto); // Le quitamos el '+' al id
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datasetsService.remove(+id);
  }

  @Get('storage-stats')
  @UseGuards(JwtAuthGuard)
  async getStorageStats() {
    return this.datasetsService.getStorageStats();
  }
}

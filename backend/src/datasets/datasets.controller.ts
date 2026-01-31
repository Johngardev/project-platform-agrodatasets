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
} from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateImageDto } from './dto/create-image.dto';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // 1. Solo usuarios autenticados
  create(@Body() createDatasetDto: CreateDatasetDto, @Req() req: any) {
    // 2. Obtenemos el ID del usuario desde el Token decodificado
    const userId = req.user.userId;

    // 3. Llamamos al servicio pasando los datos y el ID del dueño
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

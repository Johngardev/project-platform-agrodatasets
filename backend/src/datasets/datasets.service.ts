/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dataset, DatasetDocument } from './schemas/dataset.schema';
import { Image, ImageDocument } from './schemas/image.schema';
import { CreateImageDto } from './dto/create-image.dto';

@Injectable()
export class DatasetsService {
  constructor(
    @InjectModel(Dataset.name) private datasetModel: Model<DatasetDocument>,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) {}

  async create(
    createDatasetDto: CreateDatasetDto,
    userId: string,
  ): Promise<Dataset> {
    const createdDataset = new this.datasetModel({
      ...createDatasetDto, // Copia título, descripción, cultivo
      uploaded_by: userId, // Asigna el ID del usuario que sube el dataset
      status: 'PENDING', // Estado inicial por defecto
      image_count: 0,
    });
    return createdDataset.save();
  }

  async addImage(
    datasetId: string,
    createImageDto: CreateImageDto,
  ): Promise<Image> {
    // 1. Verificar si el dataset existe
    const dataset = await this.datasetModel.findById(datasetId);
    if (!dataset) {
      throw new NotFoundException(`Dataset con ID ${datasetId} no encontrado`);
    }

    // 2. Crear la imagen vinculada
    const newImage = new this.imageModel({
      ...createImageDto,
      dataset_id: datasetId, // Vinculamos la imagen al padre
    });

    const savedImage = await newImage.save();

    // 3. Actualizar el contador de imágenes en el Dataset (Operación Atómica)
    // $inc incrementa en 1 el valor existente.
    await this.datasetModel.findByIdAndUpdate(datasetId, {
      $inc: { image_count: 1 },
    });

    return savedImage;
  }

  findAll() {
    return `This action returns all datasets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dataset`;
  }

  update(id: number, updateDatasetDto: UpdateDatasetDto) {
    return `This action updates a #${id} dataset`;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}

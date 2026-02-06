/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dataset, DatasetDocument } from './schemas/dataset.schema';
import { Image, ImageDocument } from './schemas/image.schema';
import { CreateImageDto } from './dto/create-image.dto';
import path from 'path/win32';
import AdmZip from 'adm-zip';

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

  findAll(): Promise<Dataset[]> {
    return this.datasetModel
      .find()
      .populate('uploaded_by', 'username email') // Poblamos solo campos específicos
      .exec();
  }

  async findOne(id: string) {
    // Verificamos si el ID tiene formato válido de Mongo para evitar crashes
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de dataset inválido');
    }

    const dataset = await this.datasetModel
      .findById(id)
      .populate('uploaded_by', 'name email')
      .exec();

    if (!dataset) {
      throw new NotFoundException(`Dataset #${id} no encontrado`);
    }

    // Convertimos el string 'id' a un ObjectId real para que coincida con la DB
    const images = await this.imageModel.find({
      dataset_id: id,
    } as any);

    return {
      dataset,
      images,
    };
  }

  processDataset(file: Express.Multer.File) {
    console.log('📂 Service procesando archivo:', file.path);

    // 1. Definir dónde vamos a descomprimir
    // Creamos una carpeta con el mismo nombre del archivo (sin .zip)
    const extractPath = path.join(
      path.dirname(file.path),
      'extracted',
      file.filename.replace(/\.[^/.]+$/, ''),
    );

    // 2. Intentar descomprimir
    try {
      const zip = new AdmZip(file.path);

      // true = sobrescribir si ya existe
      zip.extractAllTo(extractPath, true);

      console.log(`Archivo descomprimido en: ${extractPath}`);

      // 3. Ver qué archivos hay dentro (opcional, para verificar)
      const zipEntries = zip.getEntries();
      const fileNames = zipEntries.map((entry) => entry.entryName);

      return {
        message: 'Dataset subido y descomprimido exitosamente',
        originalName: file.originalname,
        extractedLocation: extractPath,
        filesFound: fileNames, // Devolvemos la lista de archivos encontrados
      };
    } catch (error) {
      console.error('Error al descomprimir:', error);
      return {
        message: 'Error al procesar el archivo ZIP',
        error: error.message,
      };
    }
  }

  update(id: number, updateDatasetDto: UpdateDatasetDto) {
    return `This action updates a #${id} dataset`;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

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
import * as fs from 'fs';
import csv from 'csv-parser';

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

  async processDataset(file: Express.Multer.File) {
    console.log('Service procesando archivo:', file.path);

    // 1. Definir rutas
    const extractPath = path.join(
      path.dirname(file.path),
      'extracted',
      file.filename.replace(/\.[^/.]+$/, ''),
    );

    try {
      // 2. Descomprimir
      const zip = new AdmZip(file.path);
      zip.extractAllTo(extractPath, true);
      console.log(`Descomprimido en: ${extractPath}`);

      // 3. Leer el contenido de la carpeta
      const files = fs.readdirSync(extractPath);

      // 4. Buscar archivos específicos
      const imageFiles = files.filter((f) => f.match(/\.(jpg|jpeg|png)$/i));
      const csvFile = files.find((f) => f.endsWith('.csv'));

      let annotations = {};

      // 5. Si hay CSV, procesarlo
      if (csvFile) {
        console.log(`CSV encontrado: ${csvFile}, procesando etiquetas...`);
        const csvPath = path.join(extractPath, csvFile);
        annotations = await this.parseCsv(csvPath);
      }

      // 6. Fusionar Imágenes con sus Anotaciones y Mapear al Esquema
      const processedImages = imageFiles.map((fileName) => {
        // Obtenemos la fila del CSV correspondiente (o un objeto vacío si no existe)
        const csvRow = annotations[fileName] || {};

        // RUTA RELATIVA: "uploads/extracted/dataset-xyz/archivo.jpg"
        // Asegúrate de que esta ruta sea accesible públicamente o úsala solo internamente
        const relativePath = path.join(
          'uploads',
          'extracted',
          file.filename.replace(/\.[^/.]+$/, ''),
          fileName,
        );

        // CONSTRUCCIÓN DEL OBJETO SEGÚN EL ESQUEMA 'Image'
        return {
          file_name: fileName,
          storage_url: relativePath, // Campo 'storage_url' del esquema
          metadata: {
            width: Number(csvRow.width) || 0,
            height: Number(csvRow.height) || 0,
            ripeness_degree: csvRow.ripeness_degree || 'Unknown',

            // Reconstruimos el objeto anidado 'spectral_values'
            spectral_values: {
              r: Number(csvRow.spectral_r) || 0,
              g: Number(csvRow.spectral_g) || 0,
              b: Number(csvRow.spectral_b) || 0,
              nir: Number(csvRow.spectral_nir) || 0,
            },

            // Intentamos parsear las anotaciones si vienen como JSON string, sino array vacío
            annotations: csvRow.annotations_json
              ? JSON.parse(csvRow.annotations_json)
              : [],
          },
        };
      });

      return {
        message: 'Procesamiento exitoso',
        totalImages: processedImages.length,
        hasAnnotations: !!csvFile,
        preview: processedImages.slice(0, 3), // Devolvemos los primeros 3 al frontend
      };
    } catch (error) {
      console.error('Error al procesar:', error);
      throw error;
    }
  }

  // --- Helper para leer CSV como Promesa ---
  private parseCsv(filePath: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const results: Record<string, any> = {};

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // AQUÍ ESTA EL TRUCO:
          // Necesitamos saber cuál columna del CSV tiene el nombre de la imagen.
          // Por defecto intentamos buscar 'filename', 'image', 'id', o usamos la primera columna.

          const keys = Object.keys(data);
          // Buscamos una columna que parezca nombre de archivo (termina en .jpg)
          const filenameKey =
            keys.find((k) => data[k].toString().match(/\.(jpg|png)$/i)) ||
            keys[0];

          const fileName = data[filenameKey];

          if (fileName) {
            results[fileName] = data; // Guardamos toda la fila usando el nombre como clave
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => reject(err));
    });
  }

  update(id: number, updateDatasetDto: UpdateDatasetDto) {
    return `This action updates a #${id} dataset`;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }
}

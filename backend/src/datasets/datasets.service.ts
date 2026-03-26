/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Dataset,
  DatasetDocument,
  DatasetStatus,
} from './schemas/dataset.schema';
import { Image, ImageDocument } from './schemas/image.schema';
import { CreateImageDto } from './dto/create-image.dto';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import csv from 'csv-parser';
import { UpdateDatasetStatusDto } from './dto/update-dataset-status.dto';

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
      status: DatasetStatus.PENDING, // Estado inicial por defecto
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

  async findAll(status?: string): Promise<any[]> {
    const filter = status ? { status } : {};
    // 1. Obtenemos los datasets normales.
    // Usamos .lean() para poder modificar el objeto y agregar la imagen
    const datasets = await this.datasetModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('uploaded_by', 'username email name') // Asegúrate de traer el nombre o username
      .lean()
      .exec();

    // 2. Buscamos la última imagen de cada dataset en paralelo
    const datasetsWithImages = await Promise.all(
      datasets.map(async (dataset) => {
        const lastImage = await this.imageModel
          .findOne({ dataset_id: dataset._id as any })
          .sort({ createdAt: -1 }) // Obtenemos la más reciente
          .exec();

        return {
          ...dataset,
          // Si hay imagen devolvemos su ruta, si no, nulo
          last_image_url: lastImage ? lastImage.storage_url : null,
        };
      }),
    );

    return datasetsWithImages;
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
      dataset_id: new Types.ObjectId(id),
    } as any);

    return {
      dataset,
      images,
    };
  }

  async processDataset(file: Express.Multer.File, userId: string) {
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

      const originalName = file.originalname.replace(/\.[^/.]+$/, ''); // Sin extensión
      const newDataset = new this.datasetModel({
        name: originalName,
        description: `Dataset subido por el usuario ${userId} con ${processedImages.length} imágenes.`,
        uploaded_by: userId,
        status: DatasetStatus.PENDING,
        image_count: processedImages.length,
      });
      const savedDataset = await newDataset.save();

      const imagesToInsert = processedImages.map((img) => ({
        ...img,
        dataset_id: savedDataset._id, // Vinculamos cada imagen al nuevo dataset
      }));

      if (imagesToInsert.length > 0) {
        await this.imageModel.insertMany(imagesToInsert);
      }

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

  async updateStatus(id: string, updateStatusDto: UpdateDatasetStatusDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');

    const updated = await this.datasetModel.findByIdAndUpdate(
      id,
      {
        status: updateStatusDto.status,
        // Si lo aprueban, borramos la razón de rechazo por si antes había sido rechazado
        rejection_reason:
          updateStatusDto.status === DatasetStatus.REJECTED
            ? updateStatusDto.rejection_reason
            : null,
      },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Dataset no encontrado');
    return updated;
  }

  async update(id: string, updateDatasetDto: UpdateDatasetDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');

    const updated = await this.datasetModel.findByIdAndUpdate(
      id,
      updateDatasetDto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Dataset no encontrado');
    return updated;
  }

  remove(id: number) {
    return `This action removes a #${id} dataset`;
  }

  async getStorageStats() {
    // ⚠️ Ajusta 'uploads' al nombre real de tu carpeta donde guardas las imágenes
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let usedBytes = 0;

    try {
      // Función recursiva para sumar el peso de todos los archivos
      const calculateSize = async (dirPath: string) => {
        const files = await fs.promises.readdir(dirPath, {
          withFileTypes: true,
        });
        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            await calculateSize(filePath);
          } else {
            const stats = await fs.promises.stat(filePath);
            usedBytes += stats.size;
          }
        }
      };

      await calculateSize(uploadsDir);
    } catch (error) {
      console.warn('La carpeta de uploads aún no existe o está vacía.', error);
      usedBytes = 0;
    }

    // Definimos la capacidad total de tu servidor (ej. 5 GB para este proyecto)
    const capacityGB = 5;
    const totalCapacityBytes = capacityGB * 1024 * 1024 * 1024;
    const usedPercentage = (usedBytes / totalCapacityBytes) * 100;

    return {
      usedBytes,
      totalCapacityBytes,
      usedPercentage: Math.min(usedPercentage, 100), // Aseguramos que no pase de 100%
    };
  }
}

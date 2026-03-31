/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unused-vars */

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
import archiver from 'archiver';
import { Response } from 'express';

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
      const processedImages = imageFiles.map((osFileName) => {
        // 1. Limpiamos el nombre del archivo que viene de Windows/OS
        const cleanFileName = osFileName.replace(/[^a-zA-Z0-9.\-_]/g, '');

        // 2. Ahora sí lo buscamos en el diccionario limpio
        const csvRow = annotations[cleanFileName] || {};

        const relativePath = path.join(
          'uploads',
          'extracted',
          file.filename.replace(/\.[^/.]+$/, ''),
          osFileName,
        );

        let parsedAnnotations = [];
        if (csvRow.annotations_json) {
          try {
            const match = csvRow.annotations_json.match(/\[.*\]/);
            if (match) {
              let cleanJson = match[0].replace(/\\*"+/g, '"');
              cleanJson = cleanJson.replace(/([a-zA-Z])"([a-zA-Z])/g, '$1 $2');
              parsedAnnotations = JSON.parse(cleanJson);
            }
          } catch (error) {
            console.error(`Error al parsear JSON de ${cleanFileName}.`);
          }
        }

        return {
          file_name: cleanFileName, // Usamos el nombre limpio
          storage_url: relativePath,
          metadata: {
            width: Number(csvRow.width) || 0,
            height: Number(csvRow.height) || 0,
            ripeness_degree: csvRow.ripeness_degree?.toString() || 'Unknown',
            spectral_values: {
              r: Number(csvRow.spectral_r) || 0,
              g: Number(csvRow.spectral_g) || 0,
              b: Number(csvRow.spectral_b) || 0,
              nir: Number(csvRow.spectral_nir) || 0,
            },
            annotations: parsedAnnotations,
          },
        };
      });

      const originalName = file.originalname.replace(/\.[^/.]+$/, ''); // Sin extensión
      const user = await this.datasetModel.findOne(
        { _id: userId },
        { name: 1 },
      );
      const userName = user?.name || 'usuario desconocido';

      const newDataset = new this.datasetModel({
        name: originalName,
        description: `Dataset subido por ${userName} con ${processedImages.length} imágenes.`,
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

  // --- Helper para leer CSV (VERSIÓN BLINDADA CON REGEX) ---
  private parseCsv(filePath: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const results: Record<string, any> = {};

      try {
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const lines = rawContent
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);

        if (lines.length < 2) return resolve(results);

        for (let i = 1; i < lines.length; i++) {
          let line = lines[i].trim();

          // 1. Quitamos TODAS las comillas que envuelvan el inicio o el final
          line = line.replace(/^"+|"+$/g, '');

          // 2. Cortamos por comas
          const parts = line.split(',');
          if (parts.length < 8) continue;

          // 3. LIMPIEZA EXTREMA DEL NOMBRE DEL ARCHIVO:
          // Esto elimina cualquier caracter invisible, espacio o comilla.
          // Solo deja letras, números, puntos, guiones y guiones bajos.
          const rawFileName = parts[0];
          const fileName = rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '');

          const jsonPart = parts.slice(8).join(',');

          results[fileName] = {
            width: parts[2].trim(),
            height: parts[3].trim(),
            ripeness_degree: parts[1].trim(),
            spectral_r: parts[4].trim(),
            spectral_g: parts[5].trim(),
            spectral_b: parts[6].trim(),
            spectral_nir: parts[7].trim(),
            annotations_json: jsonPart,
          };
        }

        resolve(results);
      } catch (error) {
        reject(error);
      }
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
    // Ajusta 'uploads' al nombre real de tu carpeta donde guardas las imágenes
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

  async downloadDatasetZip(id: string, res: Response) {
    const dataset = await this.datasetModel.findById(id);
    if (!dataset) throw new Error('Dataset not found');

    const images = await this.imageModel.find({ dataset_id: id } as any);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dataset-${dataset.name.replace(/\s+/g, '_')}.zip"`,
    );

    // Iniciamos el compresor
    const archive = archiver('zip', { zlib: { level: 9 } }); // Nivel de compresión máximo

    archive.on('error', (err) => {
      throw err;
    });

    // Conectamos el archivo ZIP directamente a la respuesta HTTP
    archive.pipe(res);

    // 1. Preparamos el encabezado del CSV
    let csvContent =
      'filename,width,height,ripeness_degree,spectral_r,spectral_g,spectral_b,spectral_nir,annotations_json\n';

    // 2. Iteramos las imágenes
    images.forEach((img) => {
      // Agregamos la imagen física al ZIP (en una subcarpeta "images/")
      const filePath = path.join(process.cwd(), img.storage_url);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `images/${img.file_name}` });
      }

      // 3. Agregamos los datos al CSV
      const meta = img.metadata;
      // Escapamos el JSON para que el CSV no se rompa
      const annotations = meta.annotations
        ? JSON.stringify(meta.annotations).replace(/"/g, '""')
        : '[]';

      csvContent += `"${img.file_name}",${meta.width},${meta.height},"${meta.ripeness_degree}",${meta.spectral_values?.r || 0},${meta.spectral_values?.g || 0},${meta.spectral_values?.b || 0},${meta.spectral_values?.nir || 0},"${annotations}"\n`;
    });

    // 4. Adjuntamos el CSV generado al archivo ZIP
    archive.append(csvContent, { name: 'metadata.csv' });

    // Cerramos y enviamos
    await archive.finalize();
  }
}

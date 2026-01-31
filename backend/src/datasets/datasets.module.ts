import { Module } from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import { DatasetsController } from './datasets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { Image, ImageSchema } from './schemas/image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dataset.name, schema: DatasetSchema },
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [DatasetsController],
  providers: [DatasetsService],
})
export class DatasetsModule {}

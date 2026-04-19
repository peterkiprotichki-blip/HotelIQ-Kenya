import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { Field, FieldSchema } from './schemas/field.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Field.name, schema: FieldSchema }])],
  controllers: [FieldsController],
  providers: [FieldsService],
  exports: [FieldsService],
})
export class FieldsModule {}

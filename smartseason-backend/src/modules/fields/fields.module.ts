import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { FieldAiService } from './field-ai.service';

@Module({
  controllers: [FieldsController],
  providers: [FieldsService, FieldAiService],
  exports: [FieldsService],
})
export class FieldsModule {}

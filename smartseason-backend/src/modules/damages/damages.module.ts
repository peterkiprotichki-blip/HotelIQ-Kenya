import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DamagesService } from './damages.service';
import { DamagesController } from './damages.controller';
import { Damage, DamageSchema } from './schemas/damage.schema';
import { DamageRepository } from './repositories/damage.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Damage.name, schema: DamageSchema }]),
  ],
  controllers: [DamagesController],
  providers: [DamagesService, DamageRepository],
  exports: [DamagesService, DamageRepository],
})
export class DamagesModule {}

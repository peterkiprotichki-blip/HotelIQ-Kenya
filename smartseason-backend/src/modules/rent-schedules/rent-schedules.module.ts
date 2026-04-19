import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentSchedulesService } from './rent-schedules.service';
import { RentSchedulesController } from './rent-schedules.controller';
import { RentSchedule, RentScheduleSchema } from './schemas/rent-schedule.schema';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: RentSchedule.name, schema: RentScheduleSchema }])],
  controllers: [RentSchedulesController],
  providers: [RentSchedulesService, RentScheduleRepository],
  exports: [RentSchedulesService, RentScheduleRepository],
})
export class RentSchedulesModule {}

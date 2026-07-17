import { Module } from '@nestjs/common';
import { MapService } from './map.service';
import { MapController } from './map.controller';
import { PropertiesModule } from '../properties/properties.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PropertiesModule, EventsModule],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}

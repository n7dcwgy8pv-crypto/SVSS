import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentSchema } from 'src/models/incident.schema';
import { Ticket, TicketSchema } from 'src/models/ticket.schema';
import { Counter, CounterSchema } from 'src/models/counter.schema';
import { CounterService } from 'src/libs/service/counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incident.name, schema: IncidentSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, CounterService],
})
export class IncidentsModule {}

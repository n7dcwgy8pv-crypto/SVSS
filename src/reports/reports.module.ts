import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Ticket, TicketSchema } from 'src/models/ticket.schema';
import { Incident, IncidentSchema } from 'src/models/incident.schema';
import { ScanLog, ScanLogSchema } from 'src/models/scan-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Incident.name, schema: IncidentSchema },
      { name: ScanLog.name, schema: ScanLogSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

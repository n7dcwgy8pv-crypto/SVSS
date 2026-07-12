import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
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
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

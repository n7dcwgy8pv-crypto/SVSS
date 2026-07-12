import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket, TicketSchema } from 'src/models/ticket.schema';
import { ScanLog, ScanLogSchema } from 'src/models/scan-log.schema';
import { Counter, CounterSchema } from 'src/models/counter.schema';
import { CounterService } from 'src/libs/service/counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: ScanLog.name, schema: ScanLogSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, CounterService],
})
export class TicketsModule {}

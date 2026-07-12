import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerTicketsController } from './customer-tickets.controller';
import { CustomerTicketsService } from './customer-tickets.service';
import { Ticket, TicketSchema } from 'src/models/ticket.schema';
import { Event, EventSchema } from 'src/models/event.schema';
import { Counter, CounterSchema } from 'src/models/counter.schema';
import { CounterService } from 'src/libs/service/counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [CustomerTicketsController],
  providers: [CustomerTicketsService, CounterService],
})
export class CustomerTicketsModule {}

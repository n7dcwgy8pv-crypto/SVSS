import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from 'src/models/counter.schema';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  async nextSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return counter.seq;
  }

  async generateTicketId(): Promise<string> {
    const seq = await this.nextSequence('ticket');
    return `TKT-${String(seq).padStart(3, '0')}`;
  }

  async generateCustomerTicketId(): Promise<string> {
    const seq = await this.nextSequence('customer_ticket');
    return `TKT-C${String(seq).padStart(3, '0')}`;
  }

  async generateIncidentId(): Promise<string> {
    const seq = await this.nextSequence('incident');
    return `INC-${String(seq).padStart(3, '0')}`;
  }
}

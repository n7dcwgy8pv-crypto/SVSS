import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from 'src/models/event.schema';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  private formatEvent(e: EventDocument | Record<string, any>) {
    return {
      id: (e as any)._id.toString(),
      name: e.name,
      venue: e.venue,
      date: e.date ? new Date(e.date).toISOString().split('T')[0] : null,
      time: e.time,
      category: e.category,
      image: e.imageUrl,
      description: e.description,
      zones: e.zones || [],
    };
  }

  async findAll(query: {
    search?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 12));
    const skip = (page - 1) * pageSize;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter: any = { date: { $gte: today } };

    if (query.category) filter.category = query.category;

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$and = [
        { $or: [{ name: regex }, { venue: regex }, { category: regex }] },
      ];
    }

    const [events, total] = await Promise.all([
      this.eventModel.find(filter).sort({ date: 1 }).skip(skip).limit(pageSize).lean(),
      this.eventModel.countDocuments(filter),
    ]);

    return {
      data: events.map((e) => this.formatEvent(e as EventDocument)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id).lean();
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    return this.formatEvent(event as EventDocument);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from 'src/models/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class AdminEventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  private formatEvent(e: Record<string, unknown>) {
    return {
      id: String(e._id),
      name: e.name,
      venue: e.venue,
      date: e.date ? new Date(e.date as string).toISOString().split('T')[0] : null,
      time: e.time,
      category: e.category,
      image: e.imageUrl ?? null,
      description: e.description ?? null,
      zones: (e.zones as unknown[]) || [],
    };
  }

  async findAll(query: { page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [events, total] = await Promise.all([
      this.eventModel
        .find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean<Record<string, unknown>[]>(),
      this.eventModel.countDocuments(),
    ]);

    return {
      data: events.map((e) => this.formatEvent(e)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.eventModel
      .findById(id)
      .lean<Record<string, unknown>>();
    if (!event) throw new NotFoundException('Event not found.');
    return this.formatEvent(event);
  }

  async create(dto: CreateEventDto) {
    // Enforce unique zone names within the event
    const names = dto.zones.map((z) => z.name);
    if (new Set(names).size !== names.length) {
      throw new BadRequestException(
        'Zone names within an event must be unique.',
      );
    }

    const event = await this.eventModel.create({
      name: dto.name,
      venue: dto.venue,
      date: new Date(dto.date),
      time: dto.time,
      category: dto.category,
      imageUrl: dto.image ?? undefined,
      description: dto.description ?? undefined,
      zones: dto.zones,
    });

    const plain = event.toObject() as unknown as Record<string, unknown>;
    return this.formatEvent(plain);
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found.');

    // Enforce unique zone names if zones provided
    if (dto.zones) {
      const names = dto.zones.map((z) => z.name);
      if (new Set(names).size !== names.length) {
        throw new BadRequestException(
          'Zone names within an event must be unique.',
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates['name'] = dto.name;
    if (dto.venue !== undefined) updates['venue'] = dto.venue;
    if (dto.date !== undefined) updates['date'] = new Date(dto.date);
    if (dto.time !== undefined) updates['time'] = dto.time;
    if (dto.category !== undefined) updates['category'] = dto.category;
    if (dto.image !== undefined) updates['imageUrl'] = dto.image;
    if (dto.description !== undefined) updates['description'] = dto.description;
    if (dto.zones !== undefined) updates['zones'] = dto.zones;

    const updated = await this.eventModel
      .findByIdAndUpdate(id, updates, { new: true })
      .lean<Record<string, unknown>>();

    return this.formatEvent(updated as Record<string, unknown>);
  }

  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id);
    if (!event) throw new NotFoundException('Event not found.');
    return { message: 'Event deleted successfully.' };
  }
}

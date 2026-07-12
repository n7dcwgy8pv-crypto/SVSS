import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from 'src/models/ticket.schema';
import { Event, EventDocument } from 'src/models/event.schema';
import { CounterService } from 'src/libs/service/counter.service';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';
import { TicketStatus } from 'src/libs/utils/constants/enum';
import { UserDocument } from 'src/models/user.schema';
import { getPhotoUrl } from 'src/libs/utils/file-upload.util';

function generateSeat(zoneName: string): string {
  const initial = zoneName.charAt(0).toUpperCase();
  const num = Math.floor(Math.random() * 200) + 1;
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 8)); // A-H
  return `AUTO-${initial}${num}${letter}`;
}

@Injectable()
export class CustomerTicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    private counterService: CounterService,
  ) {}

  private formatTicket(t: TicketDocument) {
    return {
      id: t.ticketId,
      visitorName: t.visitorName,
      visitorEmail: t.visitorEmail,
      eventId: t.eventRef ? t.eventRef.toString() : null,
      event: t.event,
      eventDate: t.eventDate
        ? new Date(t.eventDate).toISOString().split('T')[0]
        : null,
      venue: t.venue,
      zone: t.zone,
      seat: t.seat,
      price: t.price,
      status: t.status,
      usedAt: t.usedAt ? t.usedAt.toISOString() : null,
      qrData: t.qrData,
      photoUrl: t.photoUrl,
      ownerId: t.ownerId ? t.ownerId.toString() : null,
      purchasedAt: t.purchasedAt ? t.purchasedAt.toISOString() : null,
      createdAt: (t as any).createdAt
        ? new Date((t as any).createdAt).toISOString().split('T')[0]
        : null,
    };
  }

  async findAll(
    customer: UserDocument,
    query: { status?: string; page?: number; pageSize?: number },
  ) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const filter: any = { ownerId: (customer as any)._id };
    if (query.status) filter.status = query.status;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ purchasedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.ticketModel.countDocuments(filter),
    ]);

    return {
      data: tickets.map((t) => this.formatTicket(t as TicketDocument)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, customer: UserDocument) {
    const ticket = await this.ticketModel.findOne({ ticketId: id }).lean();
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    if (ticket.ownerId?.toString() !== (customer as any)._id.toString()) {
      throw new ForbiddenException(
        'This ticket does not belong to your account.',
      );
    }
    return this.formatTicket(ticket as TicketDocument);
  }

  async purchase(
    dto: PurchaseTicketDto,
    photo: Express.Multer.File,
    customer: UserDocument,
  ) {
    // Find event
    const event = await this.eventModel.findById(dto.eventId);
    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    // Find zone index
    const zoneIndex = event.zones.findIndex(
      (z) => z.name.toLowerCase() === dto.zone.toLowerCase(),
    );
    if (zoneIndex === -1) {
      throw new NotFoundException('Zone not found in this event.');
    }

    // Use atomic update to decrement availability — prevents race conditions
    const updated = await this.eventModel.findOneAndUpdate(
      {
        _id: dto.eventId,
        'zones.name': event.zones[zoneIndex].name,
        'zones.available': { $gt: 0 },
      },
      { $inc: { 'zones.$.available': -1 } },
      { new: true },
    );

    if (!updated) {
      throw new ConflictException('This zone is sold out.');
    }

    const zone = updated.zones[zoneIndex];
    const ticketId = await this.counterService.generateCustomerTicketId();
    const seat = generateSeat(dto.zone);
    const qrData = `${ticketId}|${dto.visitorName}|${event.name}|${dto.zone}|${seat}`;
    const photoUrl = photo ? getPhotoUrl(photo.filename) : undefined;
    const now = new Date();

    const ticket = await this.ticketModel.create({
      ticketId,
      visitorName: dto.visitorName,
      visitorEmail: dto.visitorEmail,
      eventRef: event._id,
      event: event.name,
      eventDate: event.date,
      venue: event.venue,
      zone: dto.zone,
      seat,
      price: zone.price,
      status: TicketStatus.VALID,
      qrData,
      photoUrl,
      ownerId: (customer as any)._id,
      purchasedAt: now,
    });

    return this.formatTicket(ticket);
  }
}

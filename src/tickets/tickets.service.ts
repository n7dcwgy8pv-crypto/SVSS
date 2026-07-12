import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from 'src/models/ticket.schema';
import { ScanLog, ScanLogDocument } from 'src/models/scan-log.schema';
import { CounterService } from 'src/libs/service/counter.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { TicketStatus, ScanResult } from 'src/libs/utils/constants/enum';
import { UserDocument } from 'src/models/user.schema';
import { getPhotoUrl } from 'src/libs/utils/file-upload.util';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(ScanLog.name) private scanLogModel: Model<ScanLogDocument>,
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

  async findAll(query: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$and = [
        {
          $or: [
            { visitorName: regex },
            { ticketId: regex },
            { event: regex },
          ],
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.ticketModel.find(filter).skip(skip).limit(pageSize).lean(),
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

  async findOne(id: string) {
    const ticket = await this.ticketModel.findOne({ ticketId: id }).lean();
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    return this.formatTicket(ticket as TicketDocument);
  }

  async create(dto: CreateTicketDto, photo: Express.Multer.File) {
    const ticketId = await this.counterService.generateTicketId();
    const qrData = `${ticketId}|${dto.visitorName}|${dto.event}|${dto.zone}|${dto.seat}`;
    const photoUrl = photo ? getPhotoUrl(photo.filename) : null;

    const ticket = await this.ticketModel.create({
      ticketId,
      visitorName: dto.visitorName,
      visitorEmail: dto.visitorEmail,
      event: dto.event,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      zone: dto.zone,
      seat: dto.seat,
      status: TicketStatus.VALID,
      qrData,
      photoUrl: photoUrl ?? undefined,
    });

    return this.formatTicket(ticket);
  }

  async update(id: string, dto: UpdateTicketDto) {
    const ticket = await this.ticketModel.findOne({ ticketId: id });
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    const updates: any = { ...dto };

    if (dto.eventDate) {
      updates.eventDate = new Date(dto.eventDate);
    }

    if (dto.status === TicketStatus.USED) {
      updates.usedAt = new Date();
    } else if (dto.status) {
      // status changed to valid or invalid — clear usedAt
      updates.usedAt = null;
    }

    const updated = await this.ticketModel
      .findOneAndUpdate({ ticketId: id }, updates, { new: true })
      .lean();

    return this.formatTicket(updated as TicketDocument);
  }

  async verify(dto: VerifyTicketDto) {
    const ticket = await this.ticketModel
      .findOne({ $or: [{ qrData: dto.qrData }, { ticketId: dto.qrData }] })
      .lean();

    if (!ticket) {
      return { valid: false, reason: 'Ticket not found in system.', ticket: null };
    }

    const formatted = this.formatTicket(ticket as TicketDocument);

    if (ticket.status === TicketStatus.USED) {
      return {
        valid: false,
        reason: 'Ticket has already been used.',
        ticket: formatted,
      };
    }

    if (ticket.status === TicketStatus.INVALID) {
      return {
        valid: false,
        reason: 'Ticket is marked invalid.',
        ticket: formatted,
      };
    }

    return { valid: true, reason: null, ticket: formatted };
  }

  async approve(id: string, securityUser: UserDocument) {
    const ticket = await this.ticketModel.findOne({ ticketId: id });
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }
    if (ticket.status === TicketStatus.USED) {
      throw new ConflictException('Ticket has already been used.');
    }

    const usedAt = new Date();
    ticket.status = TicketStatus.USED;
    ticket.usedAt = usedAt;
    await ticket.save();

    await this.scanLogModel.create({
      ticketId: id,
      visitorName: ticket.visitorName,
      result: ScanResult.APPROVED,
      scannedBy: (securityUser as any)._id,
    });

    return {
      success: true,
      ticketId: id,
      usedAt: usedAt.toISOString(),
    };
  }

  async reject(id: string, securityUser: UserDocument) {
    const ticket = await this.ticketModel.findOne({ ticketId: id }).lean();
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    await this.scanLogModel.create({
      ticketId: id,
      visitorName: ticket.visitorName,
      result: ScanResult.REJECTED,
      scannedBy: (securityUser as any)._id,
    });

    return { success: true, ticketId: id };
  }
}

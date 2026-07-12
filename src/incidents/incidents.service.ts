import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from 'src/models/incident.schema';
import { Ticket, TicketDocument } from 'src/models/ticket.schema';
import { CounterService } from 'src/libs/service/counter.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentStatus } from 'src/libs/utils/constants/enum';
import { UserDocument } from 'src/models/user.schema';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private counterService: CounterService,
  ) {}

  private formatIncident(i: IncidentDocument) {
    return {
      id: i.incidentId,
      type: i.type,
      ticketId: i.ticketId || null,
      description: i.description,
      reportedBy: i.reportedBy,
      reportedById: i.reportedById.toString(),
      status: i.status,
      createdAt: (i as any).createdAt
        ? new Date((i as any).createdAt).toISOString()
        : null,
    };
  }

  async findAll(query: {
    type?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;
    const filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      // Combine with $and so other filters (type, status) are not overridden
      filter.$and = [
        {
          $or: [
            { description: regex },
            { ticketId: regex },
            { reportedBy: regex },
          ],
        },
      ];
    }

    const [incidents, total] = await Promise.all([
      this.incidentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      this.incidentModel.countDocuments(filter),
    ]);

    return {
      data: incidents.map((i) => this.formatIncident(i as IncidentDocument)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const incident = await this.incidentModel.findOne({ incidentId: id }).lean();
    if (!incident) {
      throw new NotFoundException('Incident not found.');
    }
    return this.formatIncident(incident as IncidentDocument);
  }

  async create(dto: CreateIncidentDto, reporter: UserDocument) {
    // Soft check for ticket existence
    if (dto.ticketId) {
      const ticket = await this.ticketModel
        .findOne({ ticketId: dto.ticketId })
        .lean();
      if (!ticket) {
        this.logger.warn(`Incident created with non-existent ticketId: ${dto.ticketId}`);
      }
    }

    const incidentId = await this.counterService.generateIncidentId();
    const incident = await this.incidentModel.create({
      incidentId,
      type: dto.type,
      ticketId: dto.ticketId ?? undefined,
      description: dto.description,
      reportedBy: reporter.name,
      reportedById: (reporter as any)._id,
      status: IncidentStatus.OPEN,
    });

    return this.formatIncident(incident);
  }

  async updateStatus(id: string, dto: UpdateIncidentStatusDto) {
    const incident = await this.incidentModel
      .findOneAndUpdate({ incidentId: id }, { status: dto.status }, { new: true })
      .lean();

    if (!incident) {
      throw new NotFoundException('Incident not found.');
    }
    return this.formatIncident(incident as IncidentDocument);
  }
}

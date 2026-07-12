import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from 'src/models/ticket.schema';
import { Incident, IncidentDocument } from 'src/models/incident.schema';
import { ScanLog, ScanLogDocument } from 'src/models/scan-log.schema';
import {
  IncidentStatus,
  ScanResult,
  TicketStatus,
} from 'src/libs/utils/constants/enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(ScanLog.name) private scanLogModel: Model<ScanLogDocument>,
  ) {}

  private buildDateFilter(dateFrom?: string, dateTo?: string) {
    const filter: any = {};
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }
    return filter;
  }

  async ticketsReport(query: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    event?: string;
    zone?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const filter: any = { ...this.buildDateFilter(query.dateFrom, query.dateTo) };
    if (query.status) filter.status = query.status;
    if (query.event) filter.event = new RegExp(query.event, 'i');
    if (query.zone) filter.zone = query.zone;

    const [tickets, total, valid, used, invalid] = await Promise.all([
      this.ticketModel.find(filter).skip(skip).limit(pageSize).lean(),
      this.ticketModel.countDocuments(filter),
      this.ticketModel.countDocuments({ ...filter, status: TicketStatus.VALID }),
      this.ticketModel.countDocuments({ ...filter, status: TicketStatus.USED }),
      this.ticketModel.countDocuments({ ...filter, status: TicketStatus.INVALID }),
    ]);

    return {
      summary: {
        totalTickets: total,
        validTickets: valid,
        usedTickets: used,
        invalidTickets: invalid,
      },
      tickets: tickets.map((t) => ({
        id: (t as any).ticketId,
        visitorName: t.visitorName,
        visitorEmail: (t as any).visitorEmail,
        eventId: (t as any).eventRef ? (t as any).eventRef.toString() : null,
        event: t.event,
        eventDate: (t as any).eventDate
          ? new Date((t as any).eventDate).toISOString().split('T')[0]
          : null,
        venue: (t as any).venue,
        zone: t.zone,
        seat: t.seat,
        price: (t as any).price,
        status: t.status,
        usedAt: (t as any).usedAt
          ? new Date((t as any).usedAt).toISOString()
          : null,
        qrData: (t as any).qrData,
        photoUrl: (t as any).photoUrl,
        ownerId: (t as any).ownerId ? (t as any).ownerId.toString() : null,
        purchasedAt: (t as any).purchasedAt
          ? new Date((t as any).purchasedAt).toISOString()
          : null,
        createdAt: (t as any).createdAt
          ? new Date((t as any).createdAt).toISOString().split('T')[0]
          : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async incidentsReport(query: {
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    status?: string;
  }) {
    const filter: any = { ...this.buildDateFilter(query.dateFrom, query.dateTo) };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [incidents, open, investigating, resolved] = await Promise.all([
      this.incidentModel.find(filter).sort({ createdAt: -1 }).lean(),
      this.incidentModel.countDocuments({ ...filter, status: IncidentStatus.OPEN }),
      this.incidentModel.countDocuments({ ...filter, status: IncidentStatus.INVESTIGATING }),
      this.incidentModel.countDocuments({ ...filter, status: IncidentStatus.RESOLVED }),
    ]);

    return {
      summary: {
        total: incidents.length,
        open,
        investigating,
        resolved,
      },
      incidents: incidents.map((i) => ({
        id: (i as any).incidentId,
        type: i.type,
        ticketId: (i as any).ticketId || null,
        description: i.description,
        reportedBy: i.reportedBy,
        reportedById: (i as any).reportedById
          ? (i as any).reportedById.toString()
          : null,
        status: i.status,
        createdAt: (i as any).createdAt
          ? new Date((i as any).createdAt).toISOString()
          : null,
      })),
    };
  }

  async entriesReport(query: {
    dateFrom?: string;
    dateTo?: string;
    result?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const filter: any = { ...this.buildDateFilter(query.dateFrom, query.dateTo) };
    if (query.result) filter.result = query.result;

    const [entries, total, approved, rejected] = await Promise.all([
      this.scanLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      this.scanLogModel.countDocuments(filter),
      this.scanLogModel.countDocuments({ ...filter, result: ScanResult.APPROVED }),
      this.scanLogModel.countDocuments({ ...filter, result: ScanResult.REJECTED }),
    ]);

    return {
      summary: { total, approved, rejected },
      entries: entries.map((e) => ({
        id: (e as any)._id.toString(),
        ticketId: e.ticketId,
        visitorName: e.visitorName,
        result: e.result,
        scannedBy: e.scannedBy.toString(),
        time: (e as any).createdAt
          ? new Date((e as any).createdAt).toISOString()
          : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

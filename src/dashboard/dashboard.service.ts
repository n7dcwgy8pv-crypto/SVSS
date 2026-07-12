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
export class DashboardService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
    @InjectModel(ScanLog.name) private scanLogModel: Model<ScanLogDocument>,
  ) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTickets,
      usedTickets,
      validTickets,
      invalidTickets,
      totalEntries,
      approvedEntries,
      rejectedEntries,
      totalIncidents,
      openIncidents,
      todayScans,
    ] = await Promise.all([
      this.ticketModel.countDocuments(),
      this.ticketModel.countDocuments({ status: TicketStatus.USED }),
      this.ticketModel.countDocuments({ status: TicketStatus.VALID }),
      this.ticketModel.countDocuments({ status: TicketStatus.INVALID }),
      this.scanLogModel.countDocuments(),
      this.scanLogModel.countDocuments({ result: ScanResult.APPROVED }),
      this.scanLogModel.countDocuments({ result: ScanResult.REJECTED }),
      this.incidentModel.countDocuments(),
      this.incidentModel.countDocuments({ status: IncidentStatus.OPEN }),
      this.scanLogModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),
    ]);

    return {
      totalTickets,
      usedTickets,
      validTickets,
      invalidTickets,
      totalEntries,
      approvedEntries,
      rejectedEntries,
      totalIncidents,
      openIncidents,
      todayScans,
    };
  }

  async getRecentScans(limit = 10) {
    const scans = await this.scanLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return scans.map((s) => ({
      id: (s as any)._id.toString(),
      ticketId: s.ticketId,
      visitorName: s.visitorName,
      result: s.result,
      scannedBy: s.scannedBy.toString(),
      time: (s as any).createdAt
        ? new Date((s as any).createdAt).toISOString()
        : null,
    }));
  }
}

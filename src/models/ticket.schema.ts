import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from 'src/libs/utils/constants/enum';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true, collection: 'tickets' })
export class Ticket {
  /** e.g. TKT-001 or TKT-C001 */
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ required: true, trim: true })
  visitorName: string;

  @Prop({ default: null })
  visitorEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', default: null })
  eventRef: Types.ObjectId | null;

  /** Denormalized event name snapshot */
  @Prop({ required: true })
  event: string;

  @Prop({ default: null })
  eventDate: Date;

  @Prop({ default: null })
  venue: string;

  @Prop({ required: true })
  zone: string;

  @Prop({ required: true })
  seat: string;

  @Prop({ default: null })
  price: number;

  @Prop({
    required: true,
    enum: Object.values(TicketStatus),
    default: TicketStatus.VALID,
  })
  status: TicketStatus;

  @Prop({ default: null })
  usedAt: Date;

  @Prop({ required: true, unique: true })
  qrData: string;

  @Prop({ default: null })
  photoUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  ownerId: Types.ObjectId | null;

  @Prop({ default: null })
  purchasedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Indexes
TicketSchema.index({ status: 1 });
TicketSchema.index({ ownerId: 1 });
TicketSchema.index({ qrData: 1 });

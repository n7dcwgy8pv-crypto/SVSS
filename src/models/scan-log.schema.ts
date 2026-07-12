import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ScanResult } from 'src/libs/utils/constants/enum';

export type ScanLogDocument = ScanLog & Document;

@Schema({ timestamps: true, collection: 'scan_logs' })
export class ScanLog {
  @Prop({ default: null })
  ticketId: string;

  /** Denormalized snapshot */
  @Prop({ default: null })
  visitorName: string;

  @Prop({ required: true, enum: Object.values(ScanResult) })
  result: ScanResult;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  scannedBy: Types.ObjectId;
}

export const ScanLogSchema = SchemaFactory.createForClass(ScanLog);

ScanLogSchema.index({ createdAt: -1 });

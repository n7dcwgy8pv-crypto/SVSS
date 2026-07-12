import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IncidentType, IncidentStatus } from 'src/libs/utils/constants/enum';

export type IncidentDocument = Incident & Document;

@Schema({ timestamps: true, collection: 'incidents' })
export class Incident {
  /** e.g. INC-001 */
  @Prop({ required: true, unique: true })
  incidentId: string;

  @Prop({ required: true, enum: Object.values(IncidentType) })
  type: IncidentType;

  @Prop({ default: null })
  ticketId: string;

  @Prop({ required: true })
  description: string;

  /** Denormalized name snapshot */
  @Prop({ required: true })
  reportedBy: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedById: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(IncidentStatus),
    default: IncidentStatus.OPEN,
  })
  status: IncidentStatus;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);

IncidentSchema.index({ status: 1 });
IncidentSchema.index({ type: 1 });

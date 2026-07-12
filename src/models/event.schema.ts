import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventCategory } from 'src/libs/utils/constants/enum';

export type EventDocument = Event & Document;

class EventZone {
  name: string;
  price: number;
  available: number;
}

@Schema({ timestamps: true, collection: 'events' })
export class Event {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  venue: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true, enum: Object.values(EventCategory) })
  category: EventCategory;

  @Prop({ default: null })
  imageUrl: string;

  @Prop({ default: null })
  description: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        available: { type: Number, required: true, default: 0 },
      },
    ],
    default: [],
  })
  zones: EventZone[];
}

export const EventSchema = SchemaFactory.createForClass(Event);

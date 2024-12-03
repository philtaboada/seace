import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessOfferDocument = BusinessOffer & Document;

@Schema({ timestamps: true })
export class BusinessOffer {

  _id!: Types.ObjectId;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BusinessOffer.name, required: true })
  seaceDataId!: string;

  @Prop({ type: String, required: true })
  ruc!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Date, required: true })
  presentationAt!: string;

}

export const BusinessOfferSchema = SchemaFactory.createForClass(BusinessOffer);

BusinessOfferSchema.set('toObject', { virtuals: true });
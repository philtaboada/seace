import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SeaceData } from './seace-data.schema';
import { BusinessOffer } from './business-offer.schema';

export type BusinessOfferPdfDocument = BusinessOfferPdf & Document;

@Schema({ timestamps: true })
export class BusinessOfferPdf {

  _id!: Types.ObjectId;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: SeaceData.name, required: true })
  seaceDataId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: BusinessOffer.name, required: true })
  businessOfferId!: string;

  @Prop({ type: String, required: true })
  filename!: string;

  @Prop({ type: String, required: true })
  realfilename!: string;

  @Prop({ type: Boolean, default: false })
  isFileExist!: boolean;

  @Prop({ type: String, required: true })
  filesize!: string;

  @Prop({ type: String, default: 'application/pdf' })
  contentType!: string;

}

export const BusinessOfferPdfSchema = SchemaFactory.createForClass(BusinessOfferPdf);

BusinessOfferPdfSchema.set('toObject', { virtuals: true });
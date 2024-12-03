import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SeaceData } from './seace-data.schema';

export type BusinessBasePdfDocument = BusinessBasePdf & Document;

@Schema({ timestamps: true })
export class BusinessBasePdf {

  _id!: Types.ObjectId;
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: SeaceData.name, required: true })
  seaceDataId!: string;

  @Prop({ type: String, required: true })
  realfilename!: string;

  @Prop({ type: Boolean, default: false })
  isFileExist!: boolean;

  @Prop({ type: String, default: 'application/pdf' })
  contentType!: string;

}

export const BusinessBasePdfSchema = SchemaFactory.createForClass(BusinessBasePdf);

BusinessBasePdfSchema.set('toObject', { virtuals: true });
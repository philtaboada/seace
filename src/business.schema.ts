import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {

  _id!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt!: any;

  @Prop({ type: String, required: true, enum: ['DNI', 'RUC', 'CE'] })
  documentType!: any;

  @Prop({ type: String, required: true })
  document!: any;

}

export const BusinessSchema = SchemaFactory.createForClass(Business);

BusinessSchema.set('toObject', { virtuals: true });
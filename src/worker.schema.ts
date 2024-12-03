import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkerDocument = Worker & Document;

@Schema({ timestamps: true })
export class Worker {

  _id!: Types.ObjectId;

  @Prop({ type: String, enum: ['RUC', 'DNI', 'CE'], default: "DNI" })
  documentType!: string;
  
  @Prop({ type: String, maxlength: 11, default: null })
  document!: string|null;
  
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: '' })
  email!: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String, maxlength: 240, default: null })
  address!: string;

  @Prop({ type: String, default: '' })
  mobileNumber!: string;

  @Prop({ type: Date, default: null })
  birthDate!: string;

  @Prop({ type: Date, default: null })
  deletedAt!: any;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId!: string;

}

export const WorkerSchema = SchemaFactory.createForClass(Worker);

WorkerSchema.set('toObject', { virtuals: true });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeaceErrorDocument = SeaceError & Document;

@Schema({ timestamps: true })
export class SeaceError {

  _id!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  fechaPublicacion!: string;

  @Prop({ type: String, required: true })
  objetoContratacion!: string;

  @Prop({ type: String, required: true })
  momenclatura!: string;

  @Prop({ type: String, required: true })
  valorReferencial!: string;

  @Prop({ type: String, required: true })
  departamento!: string;

  @Prop({ type: String, default: null })
  observations!: string|null;

}

export const SeaceErrorSchema = SchemaFactory.createForClass(SeaceError);

SeaceErrorSchema.set('toObject', { virtuals: true });
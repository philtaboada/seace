import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PartnershipDocument = Partnership & Document;

@Schema({ timestamps: true })
export class Partnership {
  
  _id!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  document!: string;

  @Prop({ type: String, required: true })
  name!: string;

}

export const PartnershipSchema = SchemaFactory.createForClass(Partnership);

PartnershipSchema.set('toObject', { virtuals: true });

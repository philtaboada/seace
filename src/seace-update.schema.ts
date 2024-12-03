import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SeaceData } from './seace-data.schema';

export type SeaceUpdateDocument = SeaceUpdate & Document;

@Schema({ timestamps: true })
export class SeaceUpdate {

    _id!: Types.ObjectId;

    @Prop({ type: String, required: true })
    estado!: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: SeaceData.name, required: true })
    seaceDataId!: string

}

export const SeaceUpdateSchema = SchemaFactory.createForClass(SeaceUpdate);

SeaceUpdateSchema.set('toObject', { virtuals: true });
import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Worker } from './worker.schema';

export type SeaceDataDocument = SeaceData & Document;

@Schema({ timestamps: true })
export class SeaceData {

    _id!: Types.ObjectId;

    @Prop({ type: String, required: true })
    convocatoriaId!: string;

    @Prop({ type: String, default: null })
    bidder!: string | null;

    @Prop({ type: Date, required: true })
    buenaProDate!: string;

    @Prop({ type: Date, required: true })
    convocatoriaDate!: string;

    @Prop({ type: Date, default: null })
    adjudicadoDate!: string;

    @Prop({ type: Date, required: true })
    publicacionDate!: string;

    @Prop({ type: String, required: true })
    objetoContratacion!: string;

    @Prop({ type: String, required: true })
    momenclatura!: string;

    @Prop({ type: String, required: true })
    estado!: string;

    @Prop({ type: String, required: true })
    valorReferencial!: string;

    @Prop({ type: String, required: true })
    departamento!: string;

    @Prop({ type: Boolean, required: true })
    isOfferAtag!: string;

    @Prop({ type: Boolean, required: true })
    isBaseAtag!: string;

    @Prop({ type: [String], required: true })
    businesses!: string[];

    @Prop({ type: String, default: null })
    observations!: string | null;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Worker.name, default: null })
    workerId!: string | null;

}

export const SeaceDataSchema = SchemaFactory.createForClass(SeaceData);

SeaceDataSchema.set('toObject', { virtuals: true });

SeaceDataSchema.virtual('worker', {
    ref: Worker.name,
    localField: 'workerId',
    foreignField: '_id',
    justOne: true,
});
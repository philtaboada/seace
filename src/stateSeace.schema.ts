import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StateSeaceDocument = StateSeace & Document;

@Schema({ timestamps: true })
export class StateSeace {

    _id!: Types.ObjectId;

    @Prop({ type: Number, default: 0 })
    objetoIndex!: any;

    @Prop({ type: Number, default: 0 })
    departamentoIndex!: any;

    @Prop({ type: Number, default: 1 })
    yearIndex!: any;

}

export const StateSeaceSchema = SchemaFactory.createForClass(StateSeace);

StateSeaceSchema.set('toObject', { virtuals: true });
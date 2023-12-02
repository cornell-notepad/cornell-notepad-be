import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import mongoose from "mongoose"
import {UserNew} from "./User"

export class NoteNew {
    @prop({ required: true })
    topic!: string
    @prop()
    keywordsQuestions!: string
    @prop()
    notes!: string
    @prop()
    summary!: string
}

@modelOptions({
    schemaOptions: {
        timestamps: true
    }
})
export class NoteCreated extends NoteNew {
    @prop({ ref: () => UserNew })
    user!: mongoose.Types.ObjectId
    @prop({ auto: true })
    _id!: mongoose.Types.ObjectId
    @prop({ auto: true })
    __v!: number
    @prop({ auto: true })
    createdAt!: Date
    @prop({ auto: true })
    updatedAt!: Date
}

export const NoteModel = getModelForClass(NoteCreated, {
    schemaOptions:
    {
        collection: "notes"
    }
})
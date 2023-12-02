import {getModelForClass, mongoose, prop} from "@typegoose/typegoose"

export class UserBase {
    @prop({ required: true })
    firstName!: string
    @prop({ required: true })
    lastName!: string
}

export class UserNew extends UserBase {
    @prop({ required: true, unique: true })
    username!: string
    @prop({ required: true })
    password!: string
}

export class UserCreated extends UserNew {
    @prop({ auto: true })
    _id!: mongoose.Types.ObjectId
    @prop({ auto: true })
    __v!: number
}

export const UserModel = getModelForClass(UserCreated, {
    schemaOptions:
    {
        collection: "users"
    }
})
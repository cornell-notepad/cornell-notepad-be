import {NotFoundError} from "../errors/NotFoundError";
import {UserBase, UserCreated, UserNew, UserModel} from "../models/User";
import bcrypt from "bcrypt"

export class UsersService {
    static async create(user: UserNew): Promise<void> {
        let userModel = new UserModel({
            ...user,
            password: bcrypt.hashSync(user.password, 8)
        })
        await userModel.save()
    }

    static async getByUsername(username: string): Promise<UserCreated> {
        let foundUser = await UserModel.findOne({ username })
        if (!foundUser) {
            throw new NotFoundError("User not found")
        } else {
            const userObject = foundUser.toObject()
            return userObject
        }
    }

    static async getById(_id: string): Promise<UserCreated> {
        let foundUser = await UserModel.findOne({ _id })
        if (!foundUser) {
            throw new NotFoundError("User not found")
        } else {
            const userObject = foundUser.toObject()
            return userObject
        }
    }

    static async updateUserBaseInfo(userId: string, update: UserBase) {
        await UserModel.findByIdAndUpdate(userId, update)
    }

    static async updateUserPassword(userId: string, newPassword: string) {
        await UserModel.findByIdAndUpdate(userId, {
            password: bcrypt.hashSync(newPassword, 8)
        })
    }

    static async delete(userId: string) {
        await UserModel.findByIdAndDelete(userId)
    }
}
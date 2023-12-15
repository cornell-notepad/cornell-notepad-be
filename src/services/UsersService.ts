import PasswordValidator from "password-validator";
import {NotFoundError} from "../errors/NotFoundError";
import {UserBase, UserCreated, UserNew, UserModel} from "../models/User";
import bcrypt from "bcrypt"
import {ValidateError} from "tsoa";

export class UsersService {
    private static pwdValidator = new PasswordValidator()
        .is().min(8)
        .is().max(100)
        .has().lowercase()
        .has().uppercase()
        .has().digits()
        .has().symbols()
        .has().not().spaces()
    
    private static validatePwd(pwd: string) {
        const validationResults = this.pwdValidator.validate(pwd, { details: true }) as any[]
        if (validationResults.length > 0) {
            throw new ValidateError({
                password: {
                    message: 'Invalid password',
                    value: validationResults
                }
            }, 'Invalid password')
        }
    }

    private static hashPwd(pwd: string) {
        return bcrypt.hashSync(pwd, 8)
    }

    static async create(user: UserNew): Promise<void> {
        this.validatePwd(user.password)
        const password = this.hashPwd(user.password)
        let userModel = new UserModel({
            ...user,
            password
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
        this.validatePwd(newPassword)
        const password = this.hashPwd(newPassword)
        await UserModel.findByIdAndUpdate(userId, { password })
    }

    static async delete(userId: string) {
        await UserModel.findByIdAndDelete(userId)
    }
}
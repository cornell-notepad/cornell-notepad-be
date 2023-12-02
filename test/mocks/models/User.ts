import {faker} from "@faker-js/faker"
import mingo from "mingo"

export class UserBase {
    firstName!: string
    lastName!: string
}

export class UserNew extends UserBase {
    username!: string
    password!: string
}

export class UserCreated extends UserNew {
    _id!: string
    __v!: number
}

const users: UserModel[] = []

export class UserModel extends UserCreated {
    constructor(user: UserNew) {
        super()
        this.__v = 0
        this._id = faker.database.mongodbObjectId()
        this.firstName = user.firstName
        this.lastName = user.lastName
        this.password = user.password
        this.username = user.username
    }

    async save() {
        users.push(this)
    }

    toObject() {
        return this
    }

    static findOne(filter: any) {
        let foundUser = mingo.find(users, filter).all()[0]
        if (!foundUser) {
            return null
        } else {
            return foundUser
        }
    }

    static findByIdAndUpdate(_id: string, update: Partial<UserCreated>) {
        const userIndex = users.findIndex(note => note._id === _id)
        if (userIndex > -1) {
            let user = users[userIndex]
            for (let key of Object.keys(update)) {
                // @ts-ignore
                user[key] = update[key]
            }
        }
    }

    static findByIdAndDelete(id: string) {
        let index = users.findIndex(user => user._id === id)
        if (index > -1) {
            users.splice(index, 1)
        }
    }
}
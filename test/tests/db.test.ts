import {isCliKeyPresent} from "../utils/utils"
import {CliKey} from "../enums/CliKey"
import {mockDB} from "../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import {mongoose} from "@typegoose/typegoose"
import {UserModel} from "../mocks/models/User"
import {CornellNotepadService} from "../services/CornellNotepadService"
import {HTTPErrorBody} from "../types/cornellNotepadService/types"
import Assert from "../utils/assert"
import toMilliseconds from "@sindresorhus/to-milliseconds"
import {faker} from "@faker-js/faker"
import {generateUserPassword} from "../utils/fakerUtils"

describe('DB', () => {
    beforeAll(() => CornellNotepadService.start())

    afterAll(() => CornellNotepadService.stop())

    test('POST /auth/sign-in (disconnected database)', async () => {
        if (!isCliKeyPresent(CliKey.Integration)) {
            if (isCliKeyPresent(CliKey.MockDb)) {
                jest.spyOn(UserModel, "findOne")
                    .mockImplementation(() => { throw new Error("database not connected") })
            } else {
                await mongoose.disconnect()
            }
            const username = faker.internet.userName()
            const password = generateUserPassword()
            let signInResponse = await CornellNotepadService.signIn<HTTPErrorBody>(
                {
                    json: {
                        username,
                        password
                    }
                },
                500,
                "HTTPErrorBody"
            )
            const message = signInResponse.message
            Assert.equal(message, "Internal Server Error")
        }
    }, toMilliseconds({ seconds: 40 }))
})
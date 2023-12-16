import {isCliKeyPresent} from "../../utils/utils"
import {CliKey} from "../../enums/CliKey"
import {mockDB} from "../../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import {mongoose} from "@typegoose/typegoose"
import {UserModel} from "../../mocks/models/User"
import {HTTPErrorBody, IPostAuthSignInResponse, ValidateErrorBody} from "../../types/cornellNotepadService/types"
import { CornellNotepadService } from "../../services/CornellNotepadService"
import Assert from "../../utils/assert"
import {generateUserPassword, getRandomUser} from "../../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"
import {faker} from "@faker-js/faker"

describe('Auth', () => {
    const user = getRandomUser()
    const {
        firstName,
        lastName,
        password,
        username
    } = user

    beforeAll(() => CornellNotepadService.start())

    afterAll(() => CornellNotepadService.stop())

    describe('POST /auth/sign-up', () => {
        test('valid', async () => {
            await CornellNotepadService.signUp({
                json: user
            })
        })

        test('invalid password', async () => {
            let response = await CornellNotepadService.signUp<ValidateErrorBody>(
                {
                    json: {
                        ...user,
                        password: ' '
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.equal(response.message, "Invalid password")
            if ('password' in response.fields) {
                const password: any = response.fields.password
                Assert.equal(password.message, "Invalid password")
                Assert.sameDeepMembers(password.value, [
                    {
                        validation: "min",
                        arguments: 8,
                        message: "The string should have a minimum length of 8 characters"
                    },
                    {
                        validation: "lowercase",
                        message: "The string should have a minimum of 1 lowercase letter"
                    },
                    {
                        validation: "uppercase",
                        message: "The string should have a minimum of 1 uppercase letter"
                    },
                    {
                        validation: "digits",
                        message: "The string should have a minimum of 1 digit"
                    },
                    {
                        validation: "symbols",
                        message: "The string should have a minimum of 1 symbol"
                    },
                    {
                        validation: "spaces",
                        inverted: true,
                        message: "The string should not have spaces"
                    }
                ])
            } else {
                Assert.fail('password field is not present in response fields')
            }
        })
    })

    describe('POST /auth/sign-in', () => {
        test('valid', async () => {
            let { accessToken } = await CornellNotepadService.signIn<IPostAuthSignInResponse>(
                {
                    json: {
                        username,
                        password
                    }
                },
                200,
                "IPostAuthSignInResponse"
            )
            let Authorization: `Bearer ${string}` = `Bearer ${accessToken}`
            let registeredUser = await CornellNotepadService.getUser({
                headers: {
                    Authorization
                }
            })
            Assert.equal(registeredUser.firstName, firstName)
            Assert.equal(registeredUser.lastName, lastName)
            Assert.equal(registeredUser.username, username)
        }, toMilliseconds({ seconds: 20 }))

        test('invalid password', async () => {
            let { message } = await CornellNotepadService.signIn<HTTPErrorBody>(
                {
                    json: {
                        username,
                        password: generateUserPassword()
                    },
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(message, "Unauthorized")
        })

        test('no password', async () => {
            let signInResponse = await CornellNotepadService.signIn<ValidateErrorBody>(
                {
                    // @ts-expect-error
                    json: {
                        username
                    },
                },
                422,
                "ValidateErrorBody"
            )
            const message = signInResponse.message
            const fields = signInResponse.fields as any
            Assert.equal(message, "Validate Error")
            Assert.equal(fields["body.password"].message, "'password' is required")
        })

        test('not registered user', async () => {
            const {
                username,
                password
            } = getRandomUser()
            let signInResponse = await CornellNotepadService.signIn<HTTPErrorBody>(
                {
                    json: {
                        username,
                        password
                    },
                },
                401,
                "HTTPErrorBody"
            )
            const message = signInResponse.message
            Assert.equal(message, "Unauthorized")
        })
        
        test('disconnected database', async () => {
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
})
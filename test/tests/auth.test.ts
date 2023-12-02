import {isCliKeyPresent, sleep} from "../utils/utils"
import {CliKey} from "../enums/CliKey"
import {mockDB} from "../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import {HTTPErrorBody, IPostAuthSignInResponse, ValidateErrorBody} from "../types/cornellNotepadService/types"
import { CornellNotepadService } from "../services/CornellNotepadService"
import Assert from "../utils/assert"
import { faker } from "@faker-js/faker"
import mongoose from "mongoose"
import {getRandomUser} from "../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"
import {UserModel} from "../mocks/models/User"

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

    test('POST /auth/sign-up', async () => {
        let { status } = await CornellNotepadService.signUp({
            json: user
        })
        Assert.equal(status, 204)
    })

    test('POST /auth/sign-in', async () => {
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

    test('POST /auth/sign-in (invalid password)', async () => {
        let { message } = await CornellNotepadService.signIn<HTTPErrorBody>(
            {
                json: {
                    username,
                    password: faker.internet.password()
                },
            },
            401,
            "HTTPErrorBody"
        )
        Assert.equal(message, "Invalid password")
    })

    test('POST /auth/sign-in (no password)', async () => {
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

    test('POST /auth/sign-in (not registered user)', async () => {
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
            404,
            "HTTPErrorBody"
        )
        const message = signInResponse.message
        Assert.equal(message, "User not found")
    })

    test("invalid bearer token", async () => {
        const response = await CornellNotepadService.getUser<HTTPErrorBody>(
            {
                headers: {
                    // @ts-expect-error
                    Authorization: "invalid"
                }
            },
            401,
            "HTTPErrorBody"
        )
        Assert.equal(response.message, "Invalid token")
    })

    test("invalid authorization token", async () => {
        const response = await CornellNotepadService.getUser<HTTPErrorBody>(
            {
                headers: {
                    Authorization: "Bearer invalid"
                }
            },
            401,
            "HTTPErrorBody"
        )
        Assert.equal(response.message, "jwt malformed")
    })

    test("expired authorization token", async () => {
        const bearerExpiresIn = process.env.BEARER_EXPIRES_IN
        process.env.BEARER_EXPIRES_IN = "1m"
        try {
            const { accessToken } = await CornellNotepadService.signIn({
                json: {
                    username,
                    password
                }
            })
            await sleep(toMilliseconds({ minutes: 1 }))
            const getUserResponse = await CornellNotepadService.getUser<HTTPErrorBody>(
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(getUserResponse.message, "jwt expired")
        } finally {
            process.env.BEARER_EXPIRES_IN = bearerExpiresIn
        }
    }, toMilliseconds({ minutes: 2 }))

    test('POST /auth/sign-in (disconnected database)', async () => {
        if (isCliKeyPresent(CliKey.MockDb)) {
            jest.spyOn(UserModel, "findOne")
                .mockImplementation(() => { throw new Error("database not connected") })
        } else {
            await mongoose.disconnect()
        }
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
    }, toMilliseconds({ seconds: 40 }))
})
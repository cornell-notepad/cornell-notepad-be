import {isCliKeyPresent, sleep} from "../utils/utils"
import {CliKey} from "../enums/CliKey"
import {mockDB} from "../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import {HTTPErrorBody, IPostAuthSignInResponse, ValidateErrorBody} from "../types/cornellNotepadService/types"
import { CornellNotepadService } from "../services/CornellNotepadService"
import Assert from "../utils/assert"
import {generateUserPassword, getRandomUser} from "../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"

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
            Assert.equal(message, "Invalid password")
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
                404,
                "HTTPErrorBody"
            )
            const message = signInResponse.message
            Assert.equal(message, "User not found")
        })
    })

    describe('auth middleware', () => {
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
            if (!isCliKeyPresent(CliKey.Integration)) {
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
            }
        }, toMilliseconds({ minutes: 2 }))
    })
})
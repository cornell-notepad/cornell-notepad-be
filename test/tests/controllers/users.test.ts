import {CliKey} from "../../enums/CliKey"
import {isCliKeyPresent} from "../../utils/utils"
import {mockDB} from "../../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import {faker} from "@faker-js/faker"
import {CornellNotepadService} from "../../services/CornellNotepadService"
import Assert from "../../utils/assert"
import {generateUserPassword, getRandomNote, getRandomUser} from "../../utils/fakerUtils"
import {HTTPErrorBody, ValidateErrorBody} from "../../types/cornellNotepadService/types"
import toMilliseconds from "@sindresorhus/to-milliseconds"

describe("Users", () => {
    const user = getRandomUser()
    let Authorization: `Bearer ${string}`

    beforeAll(async () => {
        await CornellNotepadService.start()
        await CornellNotepadService.signUp({
            json: user
        })
        let { accessToken } = await CornellNotepadService.signIn({
            json: {
                username: user.username,
                password: user.password
            }
        })
        Authorization = `Bearer ${accessToken}`
    }, toMilliseconds({ seconds: 30 }))

    afterAll(() => CornellNotepadService.stop())
    
    describe("GET /user", () => {
        test("valid", async () => {
            const response = await CornellNotepadService.getUser({
                headers: {
                    Authorization
                }
            })
            const { __v, _id, ...actual } = response
            const { password, ...expected } = user
            Assert.deepEqual(actual, expected)
        })

        test("no authorization", async () => {
            const response = await CornellNotepadService.getUser<HTTPErrorBody>(
                {
                    headers: {
                        // @ts-expect-error
                        Authorization: undefined
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "No token provided")
        })
    })

    describe("PUT /user/info", () => {
        test("valid", async () => {
            const newFirstName = faker.person.firstName()
            const newLastName = faker.person.lastName()
            await CornellNotepadService.putUserInfo({
                headers: {
                    Authorization
                },
                json: {
                    firstName: newFirstName,
                    lastName: newLastName
                }
            })
            const response = await CornellNotepadService.getUser({
                headers: {
                    Authorization
                }
            })
            const { __v, _id, ...actual } = response
            user.firstName = newFirstName
            user.lastName = newLastName
            const { password, ...expected } = user
            Assert.deepEqual(actual, expected)
        }, toMilliseconds({ seconds: 20 }))

        test("no authorization", async () => {
            const newFirstName = faker.person.firstName()
            const newLastName = faker.person.lastName()
            const response = await CornellNotepadService.putUserInfo<HTTPErrorBody>(
                {
                    headers: {
                        // @ts-expect-error
                        Authorization: undefined
                    },
                    json: {
                        firstName: newFirstName,
                        lastName: newLastName
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "No token provided")
        })
    })

    describe("PUT /user/password", () => {
        test("valid", async () => {
            const newPassword = generateUserPassword()
            await CornellNotepadService.putUserPassword({
                headers: {
                    Authorization
                },
                json: {
                    currentPassword: user.password,
                    newPassword: newPassword
                }
            })
            user.password = newPassword
            const { accessToken } = await CornellNotepadService.signIn({
                json: {
                    username: user.username,
                    password: user.password
                }
            })
            Authorization = `Bearer ${accessToken}`
            const response = await CornellNotepadService.getUser({
                headers: {
                    Authorization
                }
            })
            const { __v, _id, ...actual } = response
            const { password, ...expected } = user
            Assert.deepEqual(actual, expected)
        }, toMilliseconds({ seconds: 30 }))
    
        test("wrong current password", async () => {
            const wrongCurrentPassword = faker.internet.password()
            const newPassword = generateUserPassword()
            const { message } = await CornellNotepadService.putUserPassword<HTTPErrorBody>(
                {
                    headers: {
                        Authorization
                    },
                    json: {
                        currentPassword: wrongCurrentPassword,
                        newPassword: newPassword
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(message, "Invalid password")
        })
    
        test("no authorization", async () => {
            const newPassword = generateUserPassword()
            const { message } = await CornellNotepadService.putUserPassword<HTTPErrorBody>(
                {
                    headers: {
                        // @ts-expect-error
                        Authorization: undefined
                    },
                    json: {
                        currentPassword: user.password,
                        newPassword: newPassword
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(message, "No token provided")
        })

        test("invalid new password", async () => {
            const response = await CornellNotepadService.putUserPassword<ValidateErrorBody>(
                {
                    headers: {
                        Authorization
                    },
                    json: {
                        currentPassword: user.password,
                        newPassword: ' '
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

    describe("DELETE /user", () => {
        test("valid", async () => {
            const newNote = getRandomNote()
            await CornellNotepadService.postNotes({
                headers: {
                    Authorization
                },
                json: [newNote]
            })
            await CornellNotepadService.deleteUser({
                headers: {
                    Authorization
                }
            })
            const getUserResponse = await CornellNotepadService.getUser<HTTPErrorBody>(
                {
                    headers: {
                        Authorization
                    }
                },
                404,
                "HTTPErrorBody"
            )
            Assert.equal(getUserResponse.message, "User not found")
            const getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization
                }
            })
            Assert.isEmpty(getNotesResponse.notes)
            Assert.equal(getNotesResponse.total, 0)
            let signInResponse = await CornellNotepadService.signIn<HTTPErrorBody>(
                {
                    json: {
                        username: user.username,
                        password: user.password
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(signInResponse.message, "Unauthorized")
        }, toMilliseconds({ seconds: 50 }))

        test("no authorization", async () => {
            let response = await CornellNotepadService.deleteUser<HTTPErrorBody>(
                {
                    headers: {
                        // @ts-expect-error
                        Authorization: undefined
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "No token provided")
        })
    })
})
import {isCliKeyPresent, sleep} from "../../utils/utils"
import {CliKey} from "../../enums/CliKey"
import {mockDB} from "../../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

jest.mock('../../src/consts/FromEnvVars', () => ({
    ...jest.requireActual('../../src/consts/FromEnvVars'),
    BEARER_EXPIRES_IN: "1m"
}))

import {HTTPErrorBody} from "../../types/cornellNotepadService/types"
import { CornellNotepadService } from "../../services/CornellNotepadService"
import Assert from "../../utils/assert"
import {getRandomUser} from "../../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"

describe('Authorization middleware', () => {
    const user = getRandomUser()
    const {
        password,
        username
    } = user

    beforeAll(() => CornellNotepadService.start())

    afterAll(() => CornellNotepadService.stop())

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
            await CornellNotepadService.signUp({
                json: user
            })
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
        }
    }, toMilliseconds({ minutes: 2 }))
})
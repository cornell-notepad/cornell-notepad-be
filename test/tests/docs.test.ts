import {isCliKeyPresent} from "../utils/utils"
import {CliKey} from "../enums/CliKey"
import {mockDB} from "../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import { CornellNotepadService } from "../services/CornellNotepadService"
import Assert from "../utils/assert"
import swaggerDocument from "../../build/swagger.json"

describe('Docs', () => {
    beforeAll(() => CornellNotepadService.start())

    afterAll(() => CornellNotepadService.stop())

    test('GET /docs', async () => {
        let response = await CornellNotepadService.getDocs()
        Assert.equal(response.status, 200)
    })

    test('GET /docs/swagger.json', async () => {
        let response = await CornellNotepadService.getDocsJson()
        Assert.equal(response.status, 200)
        let body = await response.json()
        Assert.deepEqual(body, swaggerDocument)
    })
})
import * as UserModelMock from "../mocks/models/User"
import * as NoteModelMock from "../mocks/models/Note"

export function mockDB() {
    jest.mock('../../src/models/User', () => UserModelMock)
    jest.mock('../../src/models/Note', () => NoteModelMock)
    jest.mock('mongoose', () => ({
        connect: () => Promise.resolve(),
        disconnect: () => Promise.resolve(),
    }))
}

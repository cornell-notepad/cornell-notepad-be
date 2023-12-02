import {isCliKeyPresent} from "../utils/utils"
import {CliKey} from "../enums/CliKey"
import {mockDB} from "../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import { HTTPErrorBody, NoteCreated, UserNew } from "../types/cornellNotepadService/types"
import { CornellNotepadService } from "../services/CornellNotepadService"
import Assert from "../utils/assert"
import {getRandomNote, getRandomUser} from "../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"
import {faker} from "@faker-js/faker"

describe('Notes', () => {
    const newNote = getRandomNote()
    let createdNote: NoteCreated
    let userId: string
    const user: UserNew = getRandomUser()
    const anotherUser = getRandomUser()
    let userAuthorization: `Bearer ${string}`
    let anotherUserAuthorization: `Bearer ${string}`

    beforeAll(async () => {
        await CornellNotepadService.start()
        await CornellNotepadService.signUp({
            json: user
        })
        await CornellNotepadService.signUp({
            json: anotherUser
        })
        let userSignInResponse = await CornellNotepadService.signIn({
            json: {
                username: user.username,
                password: user.password
            }
        })
        userAuthorization = `Bearer ${userSignInResponse.accessToken}`
        let anotherUserSignInResponse = await CornellNotepadService.signIn({
            json: {
                username: anotherUser.username,
                password: anotherUser.password
            }
        })
        anotherUserAuthorization = `Bearer ${anotherUserSignInResponse.accessToken}`
        let getUserResponse = await CornellNotepadService.getUser({
            headers: {
                Authorization: userAuthorization
            }
        })
        userId = getUserResponse._id
    }, toMilliseconds({ minutes: 1 }))

    afterAll(async () => {
        await CornellNotepadService.deleteUser({
            headers: {
                Authorization: userAuthorization
            }
        })
        await CornellNotepadService.deleteUser({
            headers: {
                Authorization: anotherUserAuthorization
            }
        })
        await CornellNotepadService.stop()
    }, toMilliseconds({ seconds: 30 }))

    describe('POST /notes', () => {
        test('valid', async () => {
            let responseWithCreatedNotes = await CornellNotepadService.postNotes({
                json: [
                    newNote
                ],
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.lengthOf(responseWithCreatedNotes, 1)
            createdNote = responseWithCreatedNotes[0]
            Assert.isNotEmpty(createdNote._id)
            let { _id, __v, createdAt, updatedAt, user, ...createdNoteData } = createdNote
            Assert.deepEqual(createdNoteData, newNote)
            Assert.equal(user, userId)
        })
    
        test('no authorization', async () => {
            let response = await CornellNotepadService.postNotes<HTTPErrorBody>(
                {
                    json: [
                        newNote
                    ],
                    headers: {
                        // @ts-ignore
                        Authorization: undefined
                    }
                },
                401,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "No token provided")
        })
    })

    describe('GET /notes', () => {
        test('valid', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let notes = await CornellNotepadService.getNotes({
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepInclude(notes, createdNote)
        })

        test('no authorization', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let response = await CornellNotepadService.getNotes<HTTPErrorBody>(
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

    describe('GET /notes/_id', () => {
        test('valid', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let note = await CornellNotepadService.getNote({
                params: {
                    _id: createdNote._id
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(note, createdNote)
        })

        test('not existing', async () => {
            const notExistingNoteId = faker.database.mongodbObjectId()
            let response = await CornellNotepadService.getNote<HTTPErrorBody>(
                {
                    params: {
                        _id: notExistingNoteId
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                404,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "Note is not found")
        })

        test('no authorization', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let response = await CornellNotepadService.getNote<HTTPErrorBody>(
                {
                    params: {
                        _id: createdNote._id
                    },
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

        test('no access', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let note = await CornellNotepadService.getNote<HTTPErrorBody>(
                {
                    params: {
                        _id: createdNote._id
                    },
                    headers: {
                        Authorization: anotherUserAuthorization
                    }
                },
                403,
                "HTTPErrorBody"
            )
            Assert.equal(note.message, "user does not have access to requested note")
        })
    })

    describe('PUT /notes/_id', () => {
        test('valid', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let updatedNote = getRandomNote()
            await CornellNotepadService.putNote({
                params: {
                    _id: createdNote._id
                },
                json: updatedNote,
                headers: {
                    Authorization: userAuthorization
                }
            })
            let noteAfterUpdate = await CornellNotepadService.getNote({
                params: {
                    _id: createdNote._id
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            let expectedUpdatedNote: NoteCreated = {
                ...createdNote,
                ...updatedNote
            }
            Assert.deepEqualExcluding(noteAfterUpdate, expectedUpdatedNote, "updatedAt")
            Assert.biggerThan(
                new Date(noteAfterUpdate.updatedAt).getTime(),
                new Date(createdNote.updatedAt).getTime()
            )
            createdNote = noteAfterUpdate
        }, toMilliseconds({ seconds: 20 }))

        
        test('no authorization', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let updatedNote = getRandomNote()
            let response = await CornellNotepadService.putNote<HTTPErrorBody>(
                {
                    params: {
                        _id: createdNote._id
                    },
                    json: updatedNote,
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

        test('no access', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let updatedNote = getRandomNote()
            let response = await CornellNotepadService.putNote<HTTPErrorBody>(
                {
                    params: {
                        _id: createdNote._id
                    },
                    json: updatedNote,
                    headers: {
                        Authorization: anotherUserAuthorization
                    }
                },
                403,
                "HTTPErrorBody"
            )
            Assert.equal(response.message, "user does not have access to requested note")
        })
    })

    describe('DELETE /notes/_id', () => {
        test('not existing', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            const randomId = faker.database.mongodbObjectId()
            let response = await CornellNotepadService.deleteNotes<HTTPErrorBody>(
                {
                    query: {
                        _ids: [
                            createdNote._id,
                            randomId
                        ]
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                404,
                "HTTPErrorBody"
            )
            Assert.deepEqual(response, {
                message: "Note is not found",
                details: [randomId]
            })
        })

        test('no access', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let response = await CornellNotepadService.deleteNotes<HTTPErrorBody>(
                {
                    query: {
                        _ids: [
                            createdNote._id
                        ]
                    },
                    headers: {
                        Authorization: anotherUserAuthorization
                    }
                },
                403,
                "HTTPErrorBody"
            )
            Assert.deepEqual(response, {
                message: "Note does not belong to user",
                details: [createdNote._id]
            })
        })

        test('no authorization', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            let response = await CornellNotepadService.deleteNotes<HTTPErrorBody>(
                {
                    query: {
                        _ids: [
                            createdNote._id
                        ]
                    },
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

        test('valid', async () => {
            if (!createdNote) Assert.fail(`note was not created`)
            await CornellNotepadService.deleteNotes({
                query: {
                    _ids: [
                        createdNote._id
                    ]
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            let notes = await CornellNotepadService.getNotes({
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.notDeepIncludeByProperties(notes, createdNote, "_id")
        }, toMilliseconds({ seconds: 20 }))
    })
})
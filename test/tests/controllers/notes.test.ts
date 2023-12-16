import {isCliKeyPresent} from "../../utils/utils"
import {CliKey} from "../../enums/CliKey"
import {mockDB} from "../../utils/mockUtils"

if (isCliKeyPresent(CliKey.MockDb)) {
    mockDB()
}

import { HTTPErrorBody, NoteCreated, UserNew, ValidateErrorBody } from "../../types/cornellNotepadService/types"
import { CornellNotepadService } from "../../services/CornellNotepadService"
import Assert from "../../utils/assert"
import {getRandomNote, getRandomUser} from "../../utils/fakerUtils"
import toMilliseconds from "@sindresorhus/to-milliseconds"
import {faker} from "@faker-js/faker"
import {NoteNew} from "../../mocks/models/Note"

describe('Notes', () => {
    const newNote = getRandomNote()
    const createdNotes: NoteCreated[] = []
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
            const createdNote = responseWithCreatedNotes[0]
            createdNotes.push(createdNote)
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

        beforeAll(async () => {
            const sampleNotes: NoteNew[] = []
            for (let i = 0; i < 5; i++) {
                sampleNotes.push(getRandomNote())
            }
            for (let note of sampleNotes) {
                const postNotesResponse = await CornellNotepadService.postNotes({
                    headers: {
                        Authorization: userAuthorization
                    },
                    json: [note]
                })
                const createdNote = postNotesResponse[0]
                createdNotes.push(createdNote)
            }
            for (let i = 0; i < createdNotes.length; i++) {
                const createdNote = faker.helpers.arrayElement(createdNotes)
                const noteUpdate = getRandomNote()
                await CornellNotepadService.putNote({
                    headers: {
                        Authorization: userAuthorization
                    },
                    params: {
                        _id: createdNote._id
                    },
                    json: noteUpdate
                })
                const updatedNote = await CornellNotepadService.getNote({
                    headers: {
                        Authorization: userAuthorization
                    },
                    params: {
                        _id: createdNote._id
                    }
                })
                const indexOfNote = createdNotes.findIndex(note => createdNote._id === note._id)
                createdNotes.splice(indexOfNote, 1, updatedNote)
            }
        }, toMilliseconds({ seconds: 150 }))

        test('all', async () => {
            const createdNote = createdNotes[0]
            if (!createdNote) Assert.fail(`note was not created`)
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, createdNotes)
            Assert.equal(getNotesResponse.total, createdNotes.length)
        })

        test('no authorization', async () => {
            let response = await CornellNotepadService.getNotes<HTTPErrorBody>(
                {
                    query: {
                        limit: 100,
                        order: 'asc',
                        skip: 0,
                        sortBy: 'createdAt'
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

        test('valid limit', async () => {
            const createdNote = createdNotes[0]
            if (!createdNote) Assert.fail(`note was not created`)
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 1,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            const [first, second] = createdNotes
            Assert.deepEqual(getNotesResponse.notes, [first])
            Assert.equal(getNotesResponse.total, createdNotes.length)
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 2,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, [first, second])
            Assert.equal(getNotesResponse.total, createdNotes.length)
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: createdNotes.length,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, createdNotes)
            Assert.equal(getNotesResponse.total, createdNotes.length)
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, createdNotes)
            Assert.equal(getNotesResponse.total, createdNotes.length)
        }, toMilliseconds({ seconds: 40 }))

        test('invalid limit', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    query: {
                        limit: 0,
                        order: 'asc',
                        skip: 0,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    limit: {
                        message: "min 1",
                        value: "0"
                    }
                }
            })
            getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    query: {
                        limit: 101,
                        order: 'asc',
                        skip: 0,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    limit: {
                        message: "max 100",
                        value: "101"
                    }
                }
            })
            getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    // @ts-expect-error
                    query: {
                        order: 'asc',
                        skip: 0,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    limit: {
                        message: "limit"
                    }
                }
            })
        }, toMilliseconds({ seconds: 30 }))

        test('valid skip', async () => {
            const createdNote = createdNotes[0]
            if (!createdNote) Assert.fail(`note was not created`)
            let skip = 0
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            const [_first, ...rest] = createdNotes
            Assert.deepEqual(getNotesResponse.notes, createdNotes)
            Assert.equal(getNotesResponse.skipped, skip)
            Assert.equal(getNotesResponse.total, createdNotes.length)
            skip = 1
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, rest)
            Assert.equal(getNotesResponse.skipped, skip)
            Assert.equal(getNotesResponse.total, createdNotes.length)
            skip = createdNotes.length - 1
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: createdNotes.length,
                    order: 'asc',
                    skip,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.deepEqual(getNotesResponse.notes, [createdNotes[createdNotes.length - 1]])
            Assert.equal(getNotesResponse.skipped, skip)
            Assert.equal(getNotesResponse.total, createdNotes.length)
            skip = createdNotes.length
            getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.isEmpty(getNotesResponse.notes)
            Assert.equal(getNotesResponse.skipped, skip)
            Assert.equal(getNotesResponse.total, createdNotes.length)
        }, toMilliseconds({ seconds: 40 }))

        test('invalid skip', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    query: {
                        limit: 100,
                        order: 'asc',
                        skip: -1,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    skip: {
                        message: "min 0",
                        value: "-1"
                    }
                }
            })
            getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    // @ts-expect-error
                    query: {
                        limit: 100,
                        order: 'asc',
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    skip: {
                        message: "skip"
                    }
                }
            })
        }, toMilliseconds({ seconds: 20 }))

        test('ascending order', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.sameDeepMembers(getNotesResponse.notes, createdNotes)
            Assert.sortedBy(getNotesResponse.notes, 'createdAt')
        })

        test('descending order', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'desc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.sameDeepMembers(getNotesResponse.notes, createdNotes)
            Assert.sortedBy(getNotesResponse.notes, 'createdAt', true)
        })

        test('invalid order', async () => {
            const order = faker.string.alphanumeric({ length: { min: 1, max: 5 }})
            let getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    query: {
                        limit: 100,
                        // @ts-expect-error
                        order,
                        skip: 0,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    order: {
                        message: "should be one of the following; ['desc','asc']",
                        value: order
                    }
                }
            })
            getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    // @ts-expect-error
                    query: {
                        limit: 100,
                        skip: 0,
                        sortBy: 'createdAt'
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    order: {
                        message: "'order' is required"
                    }
                }
            })
        }, toMilliseconds({ seconds: 20 }))

        test('sort by createdAt', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.sameDeepMembers(getNotesResponse.notes, createdNotes)
            Assert.sortedBy(getNotesResponse.notes, 'createdAt')
        })

        test('sort by updatedAt', async () => {
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'updatedAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.sameDeepMembers(getNotesResponse.notes, createdNotes)
            Assert.sortedBy(getNotesResponse.notes, 'updatedAt')
        })

        test('invalid sortBy', async () => {
            const sortBy = faker.string.alphanumeric({ length: { min: 1, max: 5 }})
            let getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    query: {
                        limit: 100,
                        order: 'asc',
                        skip: 0,
                        // @ts-expect-error
                        sortBy
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    sortBy: {
                        message: "should be one of the following; ['createdAt','updatedAt']",
                        value: sortBy
                    }
                }
            })
            getNotesResponse = await CornellNotepadService.getNotes<ValidateErrorBody>(
                {
                    // @ts-expect-error
                    query: {
                        limit: 100,
                        order: 'asc',
                        skip: 0,
                    },
                    headers: {
                        Authorization: userAuthorization
                    }
                },
                422,
                "ValidateErrorBody"
            )
            Assert.deepEqual(getNotesResponse, {
                message: "Validate Error",
                fields: {
                    sortBy: {
                        message: "'sortBy' is required",
                    }
                }
            })
        }, toMilliseconds({ seconds: 20 }))
    })

    describe('GET /notes/_id', () => {
        test('valid', async () => {
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            createdNotes.shift()
            createdNotes.unshift(noteAfterUpdate)
        }, toMilliseconds({ seconds: 20 }))

        
        test('no authorization', async () => {
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            const createdNote = createdNotes[0]
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
            let getNotesResponse = await CornellNotepadService.getNotes({
                query: {
                    limit: 100,
                    order: 'asc',
                    skip: 0,
                    sortBy: 'createdAt'
                },
                headers: {
                    Authorization: userAuthorization
                }
            })
            Assert.notDeepIncludeByProperties(getNotesResponse.notes, createdNote, "_id")
        }, toMilliseconds({ seconds: 20 }))
    })
})
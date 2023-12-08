import {faker} from "@faker-js/faker"
import mingo from "mingo"

export class NoteNew {
    topic!: string
    keywordsQuestions!: string
    notes!: string
    summary!: string
}

export class NoteCreated extends NoteNew {
    user!: string
    _id!: string
    __v!: number
    createdAt!: Date
    updatedAt!: Date
}

const notes: NoteModel[] = []

export class NoteModel extends NoteCreated {
    constructor(note: NoteNew & { user: string }) {
        super()
        const timestamp = new Date()
        this.__v = 0
        this._id = faker.database.mongodbObjectId()
        this.createdAt = timestamp
        this.keywordsQuestions = note.keywordsQuestions
        this.notes = note.notes
        this.summary = note.summary
        this.topic = note.topic
        this.updatedAt = timestamp
        this.user = note.user
    }

    async save() {
        notes.push(this)
    }

    toObject() {
        return this
    }

    static find(filter: any) {
        let foundNotes = mingo.find<NoteCreated>(notes, filter)
        Object.defineProperty(foundNotes, 'countDocuments', {
            value: () => foundNotes.count()
        })
        return foundNotes
    }

    static findOne(filter: any) {
        let note = mingo.find<NoteCreated>(notes, filter).all()[0]
        if (!note) {
            return null
        } else {
            return note
        }
    }

    static create(notesToCreate: NoteModel[]) {
        notes.push(...notesToCreate)
        return notesToCreate
    }

    static findByIdAndUpdate(_id: string, update: Partial<NoteNew>) {
        const noteIndex = notes.findIndex(note => note._id === _id)
        if (noteIndex > -1) {
            let note = notes[noteIndex]
            for (let key of Object.keys(update)) {
                // @ts-ignore
                note[key] = update[key]
            }
            note.updatedAt = new Date()
        }
    }

    static deleteMany(filter: any) {
        let notesToDelete = mingo.find<NoteCreated>(notes, filter).all()
        for (let noteToDelete of notesToDelete) {
            let noteIndex = notes.findIndex(note => note._id === noteToDelete._id)
            notes.splice(noteIndex, 1)
        }
    }
}
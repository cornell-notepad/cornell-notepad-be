import {NotFoundError} from "../errors/NotFoundError";
import { NoteCreated, NoteNew, NoteModel } from "../models/Note";

export class NotesService {
    static async getUserNotes(userId: string): Promise<NoteCreated[]> {
        const notes = await NoteModel.find({
            user: userId
        })
        const notesObjects = notes.map(note => note.toObject())
        return notesObjects
    }

    static async getNoteById(_id: string): Promise<NoteCreated> {
        let note = await NoteModel.findOne({ _id })
        if (!note) {
            throw new NotFoundError("Note is not found")
        }
        let noteObject = note.toObject()
        return noteObject
    }

    static async createUserNotes(userId: string, notes: NoteNew[]): Promise<NoteCreated[]> {
        let notesModels = notes.map(note => new NoteModel({
            user: userId,
            ...note
        }))
        const createdNotes = await NoteModel.create(notesModels)
        const createdNotesObjects = createdNotes.map(note => note.toObject())
        return createdNotesObjects
    }

    static async updateNote(_id: string, update: NoteNew) {
        await NoteModel.findByIdAndUpdate(_id, update)
    }

    static async deleteNotes(_ids: string[], userId: string) {
        await NoteModel.deleteMany({
            $and: [
                { _id: { $in: _ids } },
                { user: userId }
            ]
        })
    }

    static async getNotesByIds(_ids: string[]) {
        const notes = await NoteModel.find({ _id: { $in: _ids } })
        const notesObjects = notes.map(note => note.toObject())
        return notesObjects
    }
}
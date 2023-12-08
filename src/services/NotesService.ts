import {Order} from "../enums/Order";
import {SortBy} from "../enums/SortBy";
import {NotFoundError} from "../errors/NotFoundError";
import { NoteCreated, NoteNew, NoteModel } from "../models/Note";

export class NotesService {
    private static getSortConfig(sortBy: SortBy, order: Order) {
        let orderNumber = order === Order.desc
            ? -1
            : 1
        let sortConfig: any = sortBy === SortBy.createdAt
            ? { createdAt: orderNumber }
            : { updatedAt: orderNumber }
        return sortConfig
    }

    static async getUserNotes(
        userId: string,
        sortBy: SortBy,
        order: Order,
        skip: number,
        limit: number
    ): Promise<{
        total: number
        notes: NoteCreated[]
    }> {
        const filter = {
            user: userId,
        }
        const total = await NoteModel.find(filter).countDocuments()
        const sortConfig = this.getSortConfig(sortBy, order)
        const notesDocuments = await NoteModel.find(filter)
            .sort(sortConfig)
            .skip(skip)
            .limit(limit)
        const notes = notesDocuments.map(note => note.toObject())
        return {
            total,
            notes
        }
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

    static async deleteAllUserNotes(userId: string) {
        await NoteModel.deleteMany({
            user: userId
        })
    }

    static async getNotesByIds(_ids: string[]) {
        const notes = await NoteModel.find({ _id: { $in: _ids } })
        const notesObjects = notes.map(note => note.toObject())
        return notesObjects
    }
}
import { NoteCreated, NoteNew } from "../models/Note";
import { NotesService } from "../services/NotesService";
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Response, Route, Security, Tags } from "tsoa";
import {HTTPError} from "fets";
import {AuthenticatedRequest} from "../types/AuthenticatedRequest";
import {HTTPErrorBody} from "../types/errors/HTTPErrorBody";
import {SortBy} from "../enums/SortBy";
import {Order} from "../enums/Order";

@Route("notes")
@Tags("Notes")
export class NotesController extends Controller {
    /**
     * @isInt skip
     * @minimum skip 0
     * @isInt limit
     * @minimum limit 1
     * @maximum limit 100
     */
    @Get()
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    async getAll(
        @Query() sortBy: SortBy,
        @Query() order: Order,
        @Query() skip: number,
        @Query() limit: number,
        @Request() { user }: AuthenticatedRequest
    ): Promise<{
        /**
         * @isInt
         */
        skipped: number
        /**
         * @isInt
         */
        total: number
        notes: NoteCreated[]
    }> {
        let { total, notes } = await NotesService.getUserNotes(user._id, sortBy, order, skip, limit)
        return {
            skipped: skip,
            total,
            notes
        }
    }

    @Get("{_id}")
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    @Response<HTTPErrorBody>(403, "Forbidden")
    async get(@Path() _id: string, @Request() { user }: AuthenticatedRequest): Promise<NoteCreated | undefined> {
        let note = await NotesService.getNoteById(_id)
        if (note.user.toString() !== user._id) {
            throw new HTTPError(403, "user does not have access to requested note")
        } else {
            return note
        }
    }

    @Post()
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    async post(@Body() notes: NoteNew[], @Request() { user }: AuthenticatedRequest): Promise<NoteCreated[]> {
        let createdNotes = await NotesService.createUserNotes(user._id, notes)
        return createdNotes
    }

    @Put("{_id}")
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    @Response<HTTPErrorBody>(403, "Forbidden")
    async put(@Path() _id: string, @Body() updatedNote: NoteNew, @Request() { user }: AuthenticatedRequest) {
        let note = await NotesService.getNoteById(_id)
        if (note.user.toString() !== user._id) {
            throw new HTTPError(403, "user does not have access to requested note")
        } else {
            await NotesService.updateNote(_id, updatedNote)
        }
    }

    @Delete()
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    @Response<HTTPErrorBody>(403, "Forbidden")
    @Response<HTTPErrorBody>(404, "Not Found")
    async delete(@Query() _ids: string[], @Request() { user }: AuthenticatedRequest) {
        const notes = await NotesService.getNotesByIds(_ids)
        if (notes.length < _ids.length) {
            const notesIds = notes.map(note => note._id.toString())
            const notFoundNotes = _ids.filter(id => !notesIds.includes(id))
            throw new HTTPError(404, "Note is not found", undefined, notFoundNotes)
        }
        const notesDoesNotBelongToUser = notes.filter(note => note.user.toString() !== user._id)
        if (notesDoesNotBelongToUser.length > 0) {
            const notesIds = notesDoesNotBelongToUser.map(note => note._id)
            throw new HTTPError(403, "Note does not belong to user", undefined, notesIds)
        }
        await NotesService.deleteNotes(_ids, user._id)
    }
}
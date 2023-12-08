import {UserBase} from "../models/User";
import {UsersService} from "../services/UsersService";
import {AuthenticatedRequest} from "../types/AuthenticatedRequest";
import {PutUserPasswordRequestBody} from "../types/usersController/PutUserPasswordRequestBody";
import {Body, Controller, Delete, Get, Put, Request, Response, Route, Security, Tags} from "tsoa";
import bcrypt from "bcrypt";
import {HTTPError} from "fets";
import {NotesService} from "../services/NotesService";
import {HTTPErrorBody} from "../types/errors/HTTPErrorBody";

@Route("user")
@Tags("User")
export class UserController extends Controller {
    @Get()
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    @Response<HTTPErrorBody>(404, "Not Found")
    async get(@Request() { user }: AuthenticatedRequest) {
        const foundUser = await UsersService.getById(user._id)
        const {
            password,
            ...userInfo
        } = foundUser
        
        return userInfo
    }

    @Put("info")
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    async putInfo(@Body() update: UserBase, @Request() { user }: AuthenticatedRequest) {
        await UsersService.updateUserBaseInfo(user._id, update)
    }

    @Put("password")
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    async putPassword(@Body() body: PutUserPasswordRequestBody, @Request() { user }: AuthenticatedRequest) {
        const foundUser = await UsersService.getById(user._id)
        let passwordIsValid = bcrypt.compareSync(
            body.currentPassword,
            foundUser.password
        )
        if (!passwordIsValid) {
            throw new HTTPError(401, `Invalid password`)
        }
        await UsersService.updateUserPassword(user._id, body.newPassword)
    }

    @Delete()
    @Security("bearerAuth")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    async delete(@Request() { user }: AuthenticatedRequest) {
        await NotesService.deleteAllUserNotes(user._id)
        await UsersService.delete(user._id)
    }
}
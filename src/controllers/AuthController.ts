import {UserNew} from "../models/User";
import {UsersService} from "../services/UsersService";
import {Body, Controller, Post, Route, Tags, Response} from "tsoa";
import jwt from "jsonwebtoken"
import {HTTPError} from "fets";
import bcrypt from "bcrypt";
import {PostSignInRequestBody} from "../types/authController/PostSignInRequestBody";
import {HTTPErrorBody} from "../types/errors/HTTPErrorBody";
import {ValidateErrorBody} from "../types/errors/ValidateErrorBody";
import {API_SECRET, BEARER_EXPIRES_IN} from "../consts/FromEnvVars";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
    @Post("sign-up")
    @Response<ValidateErrorBody>(422, "Unprocessable Content")
    async signUp(@Body() user: UserNew) {
        await UsersService.create(user)
    }

    @Post("sign-in")
    @Response<HTTPErrorBody>(401, "Unauthorized")
    @Response<ValidateErrorBody>(422, "Unprocessable Content")
    async signIn(@Body() body: PostSignInRequestBody) {
        let foundUser = await UsersService.getByUsername(body.username)
        if (!foundUser) {
            throw new HTTPError(401, `Unauthorized`)
        }
        let passwordIsValid = bcrypt.compareSync(
            body.password,
            foundUser.password
        )
        if (!passwordIsValid) {
            throw new HTTPError(401, `Unauthorized`)
        }
        let accessToken: string = jwt.sign(
            { _id: foundUser._id },
            API_SECRET,
            { expiresIn: BEARER_EXPIRES_IN }
        )
        return {
            accessToken
        }
    }
}
import {Request} from "express";

export interface AuthenticatedRequest extends Request {
    user: {
        _id: string
        iat: number
        exp: number
    }
}
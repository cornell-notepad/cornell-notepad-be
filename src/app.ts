import express, {
    json,
    urlencoded,
    Response,
    Request,
    NextFunction
} from "express";
import { RegisterRoutes } from "../build/routes";
import swaggerDocument from "../build/swagger.json"
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import {ValidateError} from "tsoa";
import {HTTPError} from "fets";
import "dotenv/config"
import {NotFoundError} from "./errors/NotFoundError";
import * as jwt from "jsonwebtoken";
import {logger} from "./utils/logger";

export const app = express();

// Use body parser to read sent json payloads
app.use(
    urlencoded({
        extended: true,
    })
);
app.use(json());
let swaggerUiOpts = {
  swaggerOptions: {
    url: '/docs/swagger.json'
  }
}
app.get(swaggerUiOpts.swaggerOptions.url, (_req, res) => res.json(swaggerDocument));
app.use('/docs', swaggerUi.serveFiles(undefined, swaggerUiOpts), swaggerUi.setup(undefined, swaggerUiOpts));
mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/cornell_notepad`, {
    user: process.env.DB_USER,
    pass: process.env.DB_PASSWORD,
    authSource: "admin"
})

RegisterRoutes(app);

app.use(function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): Response | void {
    if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
            message: err.message
        });
    }
    if (err instanceof ValidateError) {
        const {
            message,
            fields
        } = err
        logger.warn(`Caught Validation Error for ${req.path}:`, fields);
        return res.status(422).json({
            message: message || "Validate Error",
            fields,
        });
    }
    if (err instanceof HTTPError) {
        const {
            status,
            message,
            details
        } = err
        return res.status(status).json({
            message,
            details
        })
    }
    if (err instanceof NotFoundError) {
        const { message } = err
        return res.status(404).json({
            message
        })
    }
    logger.error(String(err))
    return res.status(500).json({
        message: "Internal Server Error",
    });
});
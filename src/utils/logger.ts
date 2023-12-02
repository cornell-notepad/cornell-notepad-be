import {join} from "path"
import winston from "winston"

const dirname = join(process.cwd(), "logs")

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            dirname,
            filename: "error.log",
            level: "error"
        }),
        new winston.transports.File({
            dirname,
            filename: "combined.log"
        })
    ]
})
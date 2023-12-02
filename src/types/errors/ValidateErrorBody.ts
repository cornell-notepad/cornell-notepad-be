import {ValidateError} from "tsoa";

export interface ValidateErrorBody extends Pick<ValidateError, "message" | "fields"> {}
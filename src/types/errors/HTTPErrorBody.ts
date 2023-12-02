import {HTTPError} from "fets";

export interface HTTPErrorBody extends Pick<HTTPError, "message" | "details"> {}
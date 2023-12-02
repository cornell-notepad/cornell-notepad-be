import * as express from "express";
import {HTTPError} from "fets";
import * as jwt from "jsonwebtoken";

export async function expressAuthentication(
  request: express.Request,
  _securityName: string,
  _scopes?: string[]
): Promise<any> {
  const authorizationHeader = request.headers.authorization;
  if (!authorizationHeader) {
    throw new HTTPError(401, "No token provided")
  } else if (!authorizationHeader.startsWith("Bearer ")) {
    throw new HTTPError(401, "Invalid token")
  } else {
    const token = authorizationHeader.split(" ")[1]
    let decoded = jwt.verify(token, process.env.API_SECRET!)
    return decoded
  }
}
import "dotenv/config"
import * as env from "env-var"


export const SERVER_HOST = env.get('SERVER_HOST')
  .default('127.0.0.1')
  .asString()
export const SERVER_PORT = env.get('SERVER_PORT')
  .default(3000)
  .asPortNumber()

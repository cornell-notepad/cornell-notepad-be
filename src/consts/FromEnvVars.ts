import "dotenv/config"
import * as env from 'env-var'

export const DB_HOST = env.get('DB_HOST')
  .required()
  .asString()
export const DB_PORT = env.get('DB_PORT')
  .required()
  .asString()
export const DB_USER = env.get('DB_USER')
  .required()
  .asString()
export const DB_PASSWORD = env.get('DB_PASSWORD')
  .required()
  .asString()

export const PORT = env.get('PORT')
  .default(3000)
  .asPortNumber()

export const API_SECRET = env.get('API_SECRET')
  .required()
  .asString()
export const BEARER_EXPIRES_IN = env.get('BEARER_EXPIRES_IN')
  .required()
  .example('h1 | m10')
  .asString()

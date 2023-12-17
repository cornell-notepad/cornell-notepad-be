import "dotenv/config"
import {requireEnvVar} from "@vitaliystorchous/require-env-var";

export const DB_HOST = requireEnvVar('DB_HOST')
export const DB_PORT = requireEnvVar('DB_PORT')
export const DB_USER = requireEnvVar('DB_USER')
export const DB_PASSWORD = requireEnvVar('DB_PASSWORD')

export const PORT = Number(requireEnvVar('PORT', { default: '3000' })) || 3000

export const API_SECRET = requireEnvVar('API_SECRET')
export const BEARER_EXPIRES_IN = requireEnvVar('BEARER_EXPIRES_IN')
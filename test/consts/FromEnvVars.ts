import "dotenv/config"
import {requireEnvVar} from "@vitaliystorchous/require-env-var"

export const SERVER_HOST = requireEnvVar('SERVER_HOST', { default: '127.0.0.1' })
export const SERVER_PORT = Number(requireEnvVar('SERVER_PORT', { default: '3000' }))

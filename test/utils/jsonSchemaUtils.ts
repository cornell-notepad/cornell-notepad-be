import * as TJS from "typescript-json-schema";
import { join } from "path";
import { JsonSchema } from "../types/common/IJsonSchema";

export function getJsonSchemaFromInterface<T>(interfacePath: string, interfaceName: string): JsonSchema<T> {
    const program = TJS.programFromConfig(
        join(process.cwd(), 'tsconfig.json'),
        [interfacePath]
    )
    const schema = TJS.generateSchema(program, interfaceName, {
        required: true,
    })
    if (!schema) {
        throw new Error(`was not able to generate schema for interface: ${interfaceName}`)
    }
    return schema
}
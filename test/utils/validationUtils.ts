import { TypedResponse } from "fets/typings/typed-fetch"
import Assert from "./assert"
import { getJsonSchemaFromInterface } from "./jsonSchemaUtils"

export async function getValidatedResponseBody<T>(response: TypedResponse<T>, typesFile: string, interfaceName: string): Promise<T> {
    let body = await response.json()
    let jsonSchema = getJsonSchemaFromInterface<T>(typesFile, interfaceName)
    if (Assert.jsonSchema(body, jsonSchema)) {
        return body
    } else {
        throw new Error(`json object faild validation agains ${interfaceName} interface`)
    }
}
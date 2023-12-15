import {faker} from "@faker-js/faker";
import {NoteNew, UserNew} from "../types/cornellNotepadService/types";
import {shuffle} from "lodash"

export function generateUserPassword(): string {
    const length = {
        min: 2,
        max: 4
    }
    const lowercase = faker.string.alpha({
        length,
        casing: 'lower'
    })
    const uppercase = faker.string.alpha({
        length,
        casing: 'upper'
    })
    const digits = faker.string.numeric({ length })
    const symbol = faker.string.symbol(length)
    const password = shuffle([
        lowercase,
        uppercase,
        digits,
        symbol
    ]).join()
    return password
}

export function getRandomUser(): UserNew {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.userName({
        firstName,
        lastName
    })
    const password = generateUserPassword()
    return {
        firstName,
        lastName,
        username,
        password
    }
}

export function getRandomNote(): NoteNew {
    const topic = faker.lorem.sentence()
    const keywordsQuestions = faker.lorem.words({
        min: 1,
        max: 10
    })
    const notes = faker.lorem.paragraphs({
        min: 1,
        max: 3
    })
    const summary = faker.lorem.paragraph()
    return {
        topic,
        keywordsQuestions,
        notes,
        summary
    }
}
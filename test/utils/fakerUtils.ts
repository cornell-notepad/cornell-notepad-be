import {faker} from "@faker-js/faker";
import {NoteNew, UserNew} from "../types/cornellNotepadService/types";

export function getRandomUser(): UserNew {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = faker.internet.userName({
        firstName,
        lastName
    })
    const password = faker.internet.password()
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
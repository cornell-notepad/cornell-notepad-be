export function sleep(ms: number) {
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms)
    })
}

export function isCliKeyPresent(name: string) {
    return process.argv.findIndex((arg) => arg === name) !== -1
}
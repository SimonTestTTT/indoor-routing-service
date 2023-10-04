

export module Logger {
    export function log(ID: string, Message: string, loglevel: Logger.LEVEL) {
        let toLog = new Date().toISOString() + ": " + ID + ": " + Message
        switch (loglevel) {
            case LEVEL.INFO:
                toLog = '\x1b[36m' + toLog + '\x1b[0m'
                break;
            case LEVEL.WARNING:
                toLog = '\x1b[33m' + toLog + '\x1b[0m'
                break;
            case LEVEL.ERROR:
                toLog = '\x1b[31m' + toLog + '\x1b[0m'
                break;
        }
        console.log(toLog)
    }

    export enum LEVEL {
        ERROR = 'ERROR',
        INFO = 'INFO',
        WARNING = 'WARNING'
    }
}


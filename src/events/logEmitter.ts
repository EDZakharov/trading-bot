import { EventEmitter } from 'events';

export class LoggerTracker extends EventEmitter {
    constructor() {
        super();
    }

    inTable(data: any) {
        try {
            console.table(data);
        } catch (error) {
            console.log('Table construction error');
        }
    }

    base(data: any) {
        try {
            console.log(data);
        } catch (error) {
            console.log('Logging error');
        }
    }

    cleared(data: any) {
        try {
            process.stdout.write('\x1b[1A\x1b[2K');
            console.log(`\x1b[32m\u2B24\x1b[0m - ${data}`);
        } catch (error) {
            console.log('Logging error');
        }
    }
}

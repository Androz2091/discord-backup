import { EventEmitter } from 'events';

/**
 * Manage ratelimit
 */
export class RateLimitManager extends EventEmitter {
    counter: number;
    totalCount: number;
    chunk: number;
    timeWait: number;
    timePerRequest: number;

    queue: any[];
    process: boolean;
    /**
     * @param chunk - Max request before make pause
     * @param timeWait  - Pause time
     * @param timePerRequest - Time per request
     */
    constructor(chunk: number = 50, timeWait: number = 10000, timePerRequest: number = 750) {
        super();
        // Counter between chunk
        this.counter = 0;
        // Counter total
        this.totalCount = 0;

        this.chunk = chunk;
        this.timeWait = timeWait;
        this.timePerRequest = timePerRequest;

        // Request queue
        this.queue = [];
        // If ratelimit is processing
        this.process = false;
    }

    /**
     * @param {Object|Function|any[][]} dataPromised 
     * @param {?string} func 
     * @param {?any[]} args 
     * @return {Promise<any>}
     * 
     * @example
     * await resolver([
     *  [
     *      { lowerCase: (str) => str.toLowerCase() },
     *      'lowerCase',
     *      'FoO bAr',
     *  ],
     *  [
     *      (str) => str.ToUpperCase(),
     *      null,
     *      'FoO bAr',
     *  ]
     * ])
     * 
     * await resolver(
     *  { lowerCase: (str) => str.toLowerCase() },
     *  'lowerCase',
     *  'FoO bAr',
     * )
     * 
     * await resolver(
     *  (str) => str.ToUpperCase(),
     *  null,
     *  'FoO bAr',
     * )
     */
    async resolver(dataPromised: any[][] | any, func?: string, ...args: any[]): Promise<any[] | any> {
        return new Promise(async (resolve) => {
            // Return invalid data
            if (!dataPromised && !func) return resolve(null);

            // Set callback
            const callback = (result: any) => {
                if (result == 'xDFhjdgsdg') {
                    this.emit('debuf', 'Rate Limit executor timeout');
                };
                resolve(result);
            };

            // Parse / structure data
            if (Array.isArray(dataPromised)) {
                for (const [_this, _func, ..._args] of dataPromised) {
                    this.queue.push([_this, _func, callback, ..._args]);
                };
            } else {   
                this.queue.push([dataPromised, func, callback, ...args]);
            };

            // Start process
            if (!this.process) {
                this.process = true;

                // Add process
                do {
                    //@ts-ignore
                    await this._process(...this.queue.shift());
                } while (this.queue.length > 0);

                this.process = false;
                this.emit('debug', 'finish');
            };

        });
    }

    /**
     * 
     * @param {Object | Function} dataPromised 
     * @param {?string} func 
     * @param {Function} next - callback 
     * @param {?any[]} args
     * @returns 
     */
    async _process(dataPromised: Object | Function | any, func?: string, next?: any, ...args: any[]): Promise<any[] | any> {
        return new Promise(async (resolve) => {
            // Return invalid data
            if (!dataPromised) return resolve(null);

            // wait time per request
            await new Promise((res) => setTimeout(res, this.timePerRequest));
            // inc glogal count
            this.totalCount++;
            this.emit('debug', 'request %s', this.totalCount);
            
            // Check chunk
            if (this.counter >= this.chunk) {
                // Wait per chunk
                await new Promise((res) => setTimeout(res, this.timeWait));
                this.counter = 0;
            };
            // inc global count
            this.counter++;
            
            // Set timeout
            const timeout = setTimeout(() => resolve('xDFhjdgsdg'), 15000);
            
            let resultResolved;

            // Resolve data
            try {
                if (!func && typeof dataPromised === 'function') {
                    resultResolved = await dataPromised.call(dataPromised, ...args);
                } else if (typeof dataPromised[func] === 'function') {
                    resultResolved = await dataPromised[func].call(dataPromised, ...args);
                } else return resolve(null);
            } catch (err) { this.emit('error', err) }

            // Clear timeout
            clearTimeout(timeout);

            // Resolve data
            return resolve(resultResolved);
            // Trigger callback
        }).then(next);
    };
}
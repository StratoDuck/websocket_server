/**
 * Database (MongoDB + Mongoose) mock
 */
const EventEmitter = require('events');

/**
 * Workspaces are stored in-memory for the sake of the exercise,
 * instead of querying from DB.
 * Extends EventEmitter so we can listen to events upon change to data source.
 * 
 * We emit a general 'change' event for event listeners, and classify the changes
 * by flag.
 */
class Workspaces extends EventEmitter {
    constructor(){
        super();
        // Initialization of workspaces
        this.array = [
            {
                id: 'lkj54lkasd8',
                eventId: '4k5naskd83',
                owner: 'jane@doe.com',
                status: 'offline/preparing/ready/terminated/deleted',
                createdAt: '2018-08-09T18:13:00.294Z',
            },
        ];
    }
    // Support push of new workspace. Other events can be added.
    push(obj){
        this.array.push(obj);
        this.emit('change', {flag: 'insert', data: obj});
    }
}

const WORKSPACES = new Workspaces();

/**
 * Fetch documents by filter
 * 
 * @param {Object} filter
 */
const find = filter=>new Promise((resolve, reject)=>{
    if (typeof filter !== 'object')
        reject(new Error('Missing filter'));
    let filterParams = Object.keys(filter);
    if (!filterParams.length)
        resolve(WORKSPACES.array);
    resolve(WORKSPACES.array.filter(w=>{
        return filterParams.every(f=>filter[f]==w[f]);
    }));
});

/**
 * Insert new document
 * 
 * @param {Object} doc 
 */
const insert = doc=>new Promise((resolve, reject)=>{
    if (!doc || !Object.keys(doc).length)
        reject(new Error('Cannot insert empty document'));
    resolve(!!WORKSPACES.push(doc));
});

/**
 * Append an event listener
 * 
 * @param {string} eventName 
 * @param {function} cb 
 */
const watch = (eventName, cb)=>{
    WORKSPACES.on(eventName, cb);
};

/**
 * Export functions as mock to Mongoose collection connection
 */
module.exports = {
    find,
    insert,
    watch,
};

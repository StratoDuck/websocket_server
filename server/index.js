const uWS = require('uWebSockets.js');
const { v4: uuidv4 } = require('uuid');
const workspacesCollection = require('./db/workspaces.model.js');

const PORT = process.env.PORT || 3000;

// Array to keep track of all opened sockets, so server can close
// specific connections if needed
const SOCKETS = [];
// Initialize WebSocket server
const app = uWS.App();

// Freeze ws topics so values can't be mutated during run time
const TOPICS = Object.freeze({
    SOCKET_CONNECT: 'SOCKET_CONNECT',
    GET_WORKSPACES: 'GET_WORKSPACES',
    UPDATE_WORKSPACES: 'UPDATE_WORKSPACES',
    REGISTER_FOR_EVENT: 'REGISTER_FOR_EVENT',
    EVENT_WORKSPACES: 'EVENT_WORKSPACES',
    ERROR: 'ERROR',
});

const sendErrorMessage = (ws, message)=>{
    ws.send(JSON.stringify({
        type: TOPICS.ERROR,
        data: message,
    }));
};

// Send all workspaces of specific event
const sendEventWorkspaces = async (ws, eventId)=>{
    ws.send(JSON.stringify({
        type: TOPICS.EVENT_WORKSPACES + `_${eventId}`,
        data: await workspacesCollection.find({ eventId }),
    }));
};

/**
 * Callback for DB change event
 */
const onChanges = async event=>{
    switch (event.flag)
    {
        case 'insert':
            /**
             * When a change in workspaces happens, we notify all connected
             * clients - those subscribed to all workspaces, or those subscribed
             * to specific event
             */
            app.publish(TOPICS.UPDATE_WORKSPACES, JSON.stringify({
                type: TOPICS.UPDATE_WORKSPACES,
                data: await workspacesCollection.find({}),
            }));
            app.publish(TOPICS.EVENT_WORKSPACES + `_${event.data.eventId}`, JSON.stringify({
                type: TOPICS.EVENT_WORKSPACES + `_${event.data.eventId}`,
                data: await workspacesCollection.find({ eventId: event.data.eventId }),
            }));
            break;
        default:
            console.error('Unknown onChange flag');
    }
};
workspacesCollection.watch('change', onChanges);

app.ws('/', {
    // On new connection, we assign the client a unique ID
    open: (ws, req)=>{
        ws.id = uuidv4();
        SOCKETS.push(ws);
        ws.send(JSON.stringify({
            type: TOPICS.SOCKET_CONNECT,
            data: ws.id,
        }));
        console.log('Opened connection: ', ws);
        // For the exercise, cause a change in DB for demostration 
        update_db();
    },
    message: async (ws, msg)=>{
        msg = JSON.parse(Buffer.from(msg));
        switch (msg.type)
        {
            // Fetch all workspaces
            case TOPICS.GET_WORKSPACES:
                ws.subscribe(TOPICS.UPDATE_WORKSPACES);
                ws.send(JSON.stringify({
                    type: TOPICS.GET_WORKSPACES,
                    data: await workspacesCollection.find({}),
                }));
                break;
            // Subscribe to changes for specific event, instead of all workspaces
            case TOPICS.REGISTER_FOR_EVENT:
                if (!msg.id)
                {
                    sendErrorMessage(ws, 'Missing ID for subscription');
                    break;
                }
                ws.unsubscribe(TOPICS.UPDATE_WORKSPACES);
                ws.subscribe(TOPICS.EVENT_WORKSPACES + `_${msg.id}`);
                await sendEventWorkspaces(ws, msg.id);
                break;
            default:
                sendErrorMessage(ws, 'Unknown topic');
        }
    },
    // Remove socket from list upon client close
    close: (ws, code, msg)=>{
        SOCKETS.find((s, i)=>{
            if (s && s.id == ws.id)
                SOCKETS.splice(i, 1);
        });
        console.log(`Closed connection to ${ws.id}`);
    },
});

// Just for exercise, trigger a change in DB by adding new workspace
// after 5s
const update_db = ()=> {
    setTimeout(async ()=>{
        const newWorkspace = {
            id: '5b2j3bkl523',
            eventId: 'b52kj5b5',
            owner: 'jane@doe.com',
            status: 'offline',
            createdAt: '2018-08-10T18:15:00.294Z',
        };
        await workspacesCollection.insert(newWorkspace);
    }, 5000);
};

app.listen(PORT, listenSocket=>{
    if (listenSocket)
        console.log(`Server listening on port ${PORT}`);
});

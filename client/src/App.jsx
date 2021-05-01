import React, { useState, useEffect } from 'react';

// Connect to workspaces WS server
const wsClient = new WebSocket('ws://127.0.0.1:3000/');

const App = ()=>{
    const [workspaces, setWorkspaces] = useState([]);
    const [eventId, setEventId] = useState('');

    useEffect(()=>{
        // Fetch all workspaces when connection is established
        wsClient.onopen = ()=>{
            wsClient.send(JSON.stringify({type: 'GET_WORKSPACES'}));
        };
        wsClient.onclose = ()=>{
            console.log('WebSocket client disconnected');
        };
        wsClient.onmessage = msg=>{
            let resp = JSON.parse(msg.data);
            switch (resp.type)
            {
                case 'ERROR':
                    console.error(`Socker error: ${resp.data}`);
                    break;
                case 'SOCKET_CONNECT':
                    console.log(`Connected socket ID: ${resp.data}`);
                    break;
                // Update subscribed workspaces
                case 'GET_WORKSPACES':
                case 'UPDATE_WORKSPACES':
                case `EVENT_WORKSPACES_${eventId}`:
                    setWorkspaces(resp.data);
                    break;
                default:
                    console.error('Unknown message type');
            }
        }
    });

    // Subscribe to workspaces of specific event
    const registerForEvent = event=>{
        event.preventDefault();
        wsClient.send(JSON.stringify({type: 'REGISTER_FOR_EVENT', id: eventId}));
    };
    const onEventIdChange = event=>{
        setEventId(event.target.value);
    };

    return (
        <div className="App">
            <h1>Workspaces</h1>
            <form onSubmit={registerForEvent}>
                <input type="text" value={eventId} onChange={onEventIdChange}
                    placeholder="Event ID" />
                <input type="submit" value="Subscribe" />
            </form>
            {workspaces.map((w, i)=>{
                return (
                    <li key={i}>
                        Workspace {w.id}
                        <ul>
                            {Object.keys(w).map(attr=><li key={attr}>{attr}: {w[attr]}</li>)}
                        </ul>
                    </li>
                );
            })}
        </div>
    );
}

export default App;

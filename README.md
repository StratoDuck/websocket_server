# WebSocket workspaces implementation

## Solution to Step 3

If the payload of each workspace is really big, we can classify the type of change to the
collection, and then send partial payload accordingly (I've actually already started writing
the change listener is this manner).

The server will be notified on the type of change and which workspace it was, and publish to
all subscribed WebSockets a message of the following form:

```javascript
{
    workspaceId: '1234',
    eventId: 'abcd',
    flag: 'insert',
    data: {status: 'ready'},
}
```

Possible flags: `insert`, `update`, `delete`

Then client will receive the message and react accordingly:

-   `insert`: push `msg.data` into it's list of subscribed workspaces.
-   `update`: assign properties from `msg.data` to the existing object with same workspaceId.
-   `delete`: remove workspace with `msg.workspaceId` from the list.

To increase performance even more (since for `insert` payload can still be very large), we can
modify our current subscription to listen for changes on a specific projection (like mongo's
projections) and then transport only those attributes.

## WebSocket library

I chose to implement [µWebSockets.js](https://github.com/uNetworking/uWebSockets.js) as my
WebSocket server because it's written & compiled in C++ to target the Linux kernel directly
(hence why it benchmarks in performance
a lot better than other popular socket libraries like ws and Socket.IO), backed by large companies, provides support for
secure connections, and supports the Pub/Sub pattern, which is exactly what I needed for this exercise.

## How I approached this exercise

After I read the whole exercise, I understood I need to implement some type of Pub/Sub logic
with real-time delivery over WebSockets.
I chose my WS library as explained above and set up a simple server that listens to ws
connections and sends all workspaces (hardcoded in-memory at first) to client.

Afterwards I've set up a simple, barebones React client to open the socket connection and
display the list of workspaces.

Then I've added some trigger to add a new workspace and publish update to all clients.

Then I've added a form to the frontend to subscribe to specific event by ID, and added logic in
server to update the socket's subscriptions.

In the end, I've moved my hardcoded workspaces collection to an event-based mock of mongoose,
since I don't have a real mongo instance set up. But when connecting to real mongo, it will
require minimal changes in the server itself because I used same interface as Mongoose Model.

## Installation

-   `npm install`
-   To start client: `npm run client`
-   To start server: `npm run server`

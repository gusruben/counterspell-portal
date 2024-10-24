import { PeerServer } from "peer";
import type { clientList } from "./types";

const PORT = 8080;

const peerServer = PeerServer({
  port: PORT,
  path: "/",
});

let clients: clientList = {};

peerServer.on('connection', (client: any) => { //TODO: Get the right type
    // disconnect more than 2 clients, prototype doesn't support it
    if (Object.keys(clients).length >= 2) {
        client.send({type: "error", message: "The demo doesn't support more than 2 clients!"});
        client.getSocket().close();
    }

    clients[client.getId()] = client;

    client.send({
        type: "TESTING",
        data: {
            message: "Hello from HQ!"
        }
    })

    console.log(`Connection from ${client.getId()}`)
    console.log(clients.length)

    if (Object.keys(clients).length > 1) {
        let sorted = Object.values(clients);

        console.log(`Making ${sorted[1].getId()} call ${sorted[0].getId()}`)
        sorted[0].send({
            type: "assign",
            peer: sorted[1].getId()
        })

        sorted[1].send({
            type: "call",
            peer: sorted[0].getId()
        })
    }
});

peerServer.on('disconnect', (client: any) => { 
    delete clients[client.getId()]

    console.log(`Disconnection from ${client.getId()}`)
});
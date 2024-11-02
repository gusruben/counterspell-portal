import { PeerServer } from "peer";
import type { IClient } from "peer";

import { type clientList, type clientPairing } from "../types";
import { CounterspellClient } from "./modules/CounterspellClient";
import api from "./modules/Api"

const DEMO = process.env.DEMO ?? true

const PORT = process.env.PEER_PORT ? parseInt(process.env.PEER_PORT) : 8080;

const peerServer = PeerServer({
  port: PORT,
  path: "/",
});

let clients: clientList = {};
let pairings: clientPairing[] = [];

let loner: CounterspellClient | undefined;

peerServer.on('connection', (internalClient: IClient) => {
    if (Object.keys(clients).length >= 2 && DEMO) {
        internalClient.send({type: "error", message: "The demo doesn't support more than 2 clients!"});
        internalClient.getSocket()?.close();
    }

    const client = new CounterspellClient(internalClient);

    clients[internalClient.getId()] = client;

    internalClient.send({
        type: "INIT",
        data: {
            message: "Hello from HQ!"
        }
    })

    // Before adding the current client there were an odd ammount of clients
    if (loner) {
        loner.connect(client)
    }

    
    if (Object.keys(clients).length > 1 && DEMO) {
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

peerServer.on('disconnect', (internalClient: IClient) => { 

    const client = clients[internalClient.getId()];

    if (client && client.partner) {
        client.partner.disconnect(`${internalClient.getId()} disconnected prematurely`)
    }

    delete clients[internalClient.getId()]

    console.log(`Disconnection from ${client.getId()}`)
});

api(clients);
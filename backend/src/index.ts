import { PeerServer } from "peer";
import type { IClient } from "peer";

import { type clientList, type clientPairing } from "../types";
import { CounterspellClient } from "./modules/CounterspellClient";
import api from "./modules/Api"

import { config } from "dotenv";
config();

const DEMO = process.env.DEMO === "true" ? true : false;

const PORT = process.env.PEER_PORT ? parseInt(process.env.PEER_PORT) : 8080;

const peerServer = PeerServer({
  port: PORT,
  path: "/",
});

let clients: clientList = {};
let pairings: clientPairing[] = [];

let loner: CounterspellClient | undefined;

peerServer.on('connection', (internalClient: IClient) => {
    if (clients[internalClient.getId()]) {
        internalClient.send({ type: "error", message: "A client from your city is already connected!" });
        internalClient.getSocket()?.close();
        return;
    }

    const client = new CounterspellClient(internalClient);

    console.log(`Connection from ${internalClient.getId()}`);

    clients[internalClient.getId()] = client;

    internalClient.send({
        type: "INIT",
        data: {
            message: "Hello from HQ!"
        }
    })

    console.log(`Loner identified?`, loner)

    if  (loner && loner != client) {
        loner.connect(client)
        loner = undefined;
    } else {
        loner = client;
    }

    if (DEMO) {
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
    }
});

peerServer.on('disconnect', (internalClient: IClient) => { 

    const client = clients[internalClient.getId()];

    if (client && client.partner) {
        client.partner.disconnect(`${internalClient.getId()} disconnected prematurely`)

        console.log(`Loner: `, loner)
        if  (loner && loner != client) {
            loner.connect(client.partner)
            loner = undefined;
        } else {
            loner = client.partner;
        }
    }

    delete clients[internalClient.getId()]

    console.log(`Disconnection from ${internalClient.getId()}`)
});

api(clients);
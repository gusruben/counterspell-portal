import { PeerServer } from "peer";
import type { clientList } from "./types";
import fs from 'fs';

const PORT = 8080;

const ssl = {
  key: Buffer.from(fs.readFileSync('/etc/letsencrypt/live/gus.ink/privkey.pem')),
  cert: Buffer.from(fs.readFileSync('/etc/letsencrypt/live/gus.ink/fullchain.pem')),
};

const peerServer = PeerServer({
  port: PORT,
  path: "/",
  ssl: ssl,
});

let clients: clientList = {};

peerServer.on('connection', (client: any) => { //TODO: Get the right type
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
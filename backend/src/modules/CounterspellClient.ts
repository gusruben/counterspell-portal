import type { IClient } from "peer";
import type { clientPairing } from "../../types";

export class CounterspellClient {

    constructor(internal: IClient) {
        this.internalClient = internal;
        this.id = internal.getId();
        this.city = this.id;
    }

    connect(connectingPeer: CounterspellClient) {
        const connectingPeerId = connectingPeer.internalClient.getId();
        // Identify the primary peer in a way that will be identical between both clients (might be unnecessary later)
        //const isPrimaryPeer = [connectingPeerId, this.internalClient.getId()].sort()[0] == this.id;


        if (connectingPeerId == this.id) {
            console.log(`Fatal error: ${connectingPeerId} ??? Like actually how!!?!??!`)
            throw new Error("Traceback");
        }


        console.log(`Connecting ${this.id} to ${connectingPeerId} (assign|call)`);

        console.log("telling", connectingPeerId, "to call to", this.id);
        connectingPeer.internalClient.send({
            type: "call",
            data: {
                id: this.id
            }
        });

        console.log("telling", this.id, "to accept from", connectingPeerId);
        this.internalClient.send({
            type: "assign",
            data: {
                id: connectingPeerId
            }
        })

        this.partner = connectingPeer;
        connectingPeer.partner = this;
        

        connectingPeer.history.push(this.id);
        this.history.push(connectingPeerId);
    };

    disconnect(message: string) {
        if (!this.partner) return;

        // Peer is still open
        if (this.partner.internalClient.getSocket()?.readyState == 1) {

            this.partner.partner = undefined;

            this.partner.internalClient.send({
                type: "disconnect",
                data: {
                    message
                }
            })
        }

        this.internalClient.send({
            type: "disconnect",
            data: {
                message
            }
        })

        this.partner = undefined;
    };

    internalClient: IClient;
    id: string;
    city: string;
    partner: CounterspellClient | undefined;
    history: string[] = [];
}
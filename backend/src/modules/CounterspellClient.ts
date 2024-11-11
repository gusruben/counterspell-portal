import type { IClient } from "peer";
import type { clientPairing } from "../../types";

export class CounterspellClient {

    constructor(internal: IClient) {
        this.internalClient = internal;
        this.id = internal.getId();
    }

    connect(connectingPeer: CounterspellClient) {
        const connectingPeerId = connectingPeer.internalClient.getId();
        // Identify the primary peer in a way that will be identical between both clients (might be unnecessary later)
        const isPrimaryPeer = [connectingPeerId, this.internalClient.getId()].toSorted()[0] == this.id;

        connectingPeer.internalClient.send({
            type: isPrimaryPeer ? "assign" : "call",
            data: {
                id: isPrimaryPeer ? this.id : connectingPeerId
            }
        });

        this.internalClient.send({
            type: isPrimaryPeer ? "call" : "assign",
            data: {
                id: isPrimaryPeer ? connectingPeerId : this.id
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
    partner: CounterspellClient | undefined;
    /*

        Decided to change to a string[] instead of a CounterspellClient[] because disconnects
    are bound to happen so i'd like weighting to not reset whenever someone reconnects.ID's should 
    fix that.

    */
   history: string[] = [];
}
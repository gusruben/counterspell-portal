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
            type: isPrimaryPeer ? "trustedPeer" : "call",
            data: {
                id: isPrimaryPeer ? this.id : connectingPeerId
            }
        });

        this.internalClient.send({
            type: isPrimaryPeer ? "call" : "trustedPeer",
            data: {
                id: isPrimaryPeer ? connectingPeerId : this.id
            }
        })
    };

    disconnect(message: string) {
        if (!this.partner) return;

        // Peer is still open
        if (this.partner.internalClient.getSocket()?.readyState == 1) {
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
    };

    internalClient: IClient;
    id: string;
    partner: CounterspellClient | undefined;
}
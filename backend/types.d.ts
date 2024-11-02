import type { IClient } from "peer";


// interface clientList extends Object {
//     [key: string]: counterspellClient
// }
type clientList = {
    [key: string]: counterspellClient
}

type clientPairing = [counterspellClient, counterspellClient]
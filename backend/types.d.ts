import type { IClient } from "peer";


// interface clientList extends Object {
//     [key: string]: counterspellClient
// }
interface clientList extends Object {
    [key: string]: counterspellClient
}

type clientPairing = [counterspellClient, counterspellClient]
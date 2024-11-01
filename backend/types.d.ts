import type { IClient } from "peer";

interface clientList {
    [key: string]: counterspellClient
}

type clientPairing = [counterspellClient, counterspellClient]
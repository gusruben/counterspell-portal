// Peersever doesn't export any of their tpyes so im doing it for them :)

import type WebSocket from "ws";
import { randomUUID } from "node:crypto";

export interface IClient {
	getId(): string;

	getToken(): string;

	getSocket(): WebSocket | null;

	setSocket(socket: WebSocket | null): void;

	getLastPing(): number;

	setLastPing(lastPing: number): void;

	send<T>(data: T): void;
}

export class Client implements IClient {
	private readonly id: string;
	private readonly token: string;
	private socket: WebSocket | null = null;
	private lastPing: number = new Date().getTime();

	constructor({ id, token }: { id: string; token: string }) {
		this.id = id;
		this.token = token;
	}

	public getId(): string {
		return this.id;
	}

	public getToken(): string {
		return this.token;
	}

	public getSocket(): WebSocket | null {
		return this.socket;
	}

	public setSocket(socket: WebSocket | null): void {
		this.socket = socket;
	}

	public getLastPing(): number {
		return this.lastPing;
	}

	public setLastPing(lastPing: number): void {
		this.lastPing = lastPing;
	}

	public send<T>(data: T): void {
		this.socket?.send(JSON.stringify(data));
	}
}


export interface IMessage {
	readonly type: MessageType;
	readonly src: string;
	readonly dst: string;
	readonly payload?: string | undefined;
}

export interface IMessageQueue {
	getLastReadAt(): number;

	addMessage(message: IMessage): void;

	readMessage(): IMessage | undefined;

	getMessages(): IMessage[];
}

export class MessageQueue implements IMessageQueue {
	private lastReadAt: number = new Date().getTime();
	private readonly messages: IMessage[] = [];

	public getLastReadAt(): number {
		return this.lastReadAt;
	}

	public addMessage(message: IMessage): void {
		this.messages.push(message);
	}

	public readMessage(): IMessage | undefined {
		if (this.messages.length > 0) {
			this.lastReadAt = new Date().getTime();
			return this.messages.shift();
		}

		return undefined;
	}

	public getMessages(): IMessage[] {
		return this.messages;
	}
}

export interface IRealm {
	getClientsIds(): string[];

	getClientById(clientId: string): IClient | undefined;

	getClientsIdsWithQueue(): string[];

	setClient(client: IClient, id: string): void;

	removeClientById(id: string): boolean;

	getMessageQueueById(id: string): IMessageQueue | undefined;

	addMessageToQueue(id: string, message: IMessage): void;

	clearMessageQueue(id: string): void;

	generateClientId(generateClientId?: () => string): string;
}

export class Realm implements IRealm {
	private readonly clients = new Map<string, IClient>();
	private readonly messageQueues = new Map<string, IMessageQueue>();

	public getClientsIds(): string[] {
		return [...this.clients.keys()];
	}

	public getClientById(clientId: string): IClient | undefined {
		return this.clients.get(clientId);
	}

	public getClientsIdsWithQueue(): string[] {
		return [...this.messageQueues.keys()];
	}

	public setClient(client: IClient, id: string): void {
		this.clients.set(id, client);
	}

	public removeClientById(id: string): boolean {
		const client = this.getClientById(id);

		if (!client) return false;

		this.clients.delete(id);

		return true;
	}

	public getMessageQueueById(id: string): IMessageQueue | undefined {
		return this.messageQueues.get(id);
	}

	public addMessageToQueue(id: string, message: IMessage): void {
		if (!this.getMessageQueueById(id)) {
			this.messageQueues.set(id, new MessageQueue());
		}

		this.getMessageQueueById(id)?.addMessage(message);
	}

	public clearMessageQueue(id: string): void {
		this.messageQueues.delete(id);
	}

	public generateClientId(generateClientId?: () => string): string {
		const generateId = generateClientId ? generateClientId : randomUUID;

		let clientId = generateId();

		while (this.getClientById(clientId)) {
			clientId = generateId();
		}

		return clientId;
	}
}

// My types

interface clientList {
    [key: string]: Client
}
export default class RoundRobin {
    private clients: Map<string, { id: string, data: any, lastPartners: Set<string>, joinedAt: number }>;
    private currentPairings: Map<string, string>;
    private roundNumber: number;

    constructor() {
        this.clients = new Map();
        this.currentPairings = new Map();
        this.roundNumber = 0;
    }

    addClient(id: string, data = {}) {
        if (this.clients.has(id)) {
            return false;
        }

        this.clients.set(id, {
            id,
            data,
            lastPartners: new Set(),
            joinedAt: this.roundNumber
        });

        return true;
    }

    updateClientData(id: string, data: any) {
        if (!this.clients.has(id)) {
            return false;
        }

        const client = this.clients.get(id);
        if (client) client.data = { ...client.data, ...data };

        return true;
    }

    getClientData(id: string) {
        const client = this.clients.get(id);
        return client ? client.data : null;
    }

    removeClient(id: string) {
        if (!this.clients.has(id)) {
            return false;
        }

        const currentPartner = this.currentPairings.get(id);
        if (currentPartner) {
            this.currentPairings.delete(id);
            this.currentPairings.delete(currentPartner);
        }

        this.clients.delete(id);
        return true;
    }

    generateNextRound() {
        this.roundNumber++;
        this.currentPairings.clear();

        const availableClients = Array.from(this.clients.keys())
            .filter(id => !this.currentPairings.has(id));

        this.shuffleArray(availableClients);

        const pairs = this.findOptimalPairings(availableClients);

        for (const [id1, id2] of pairs) {
            this.currentPairings.set(id1, id2);
            this.currentPairings.set(id2, id1);

            const client1 = this.clients.get(id1);
            const client2 = this.clients.get(id2);
            if (client1 && client2) {
                client1.lastPartners.add(id2);
                client2.lastPartners.add(id1);
            }
        }

        return pairs;
    }

    findOptimalPairings(availableClients: string[]) {
        const pairs = [];
        const paired = new Set();

        // sort by who's met fewer people
        availableClients.sort((a, b) => {
            const clientA = this.clients.get(a);
            const clientB = this.clients.get(b);
            if (clientA && clientB) {
                return clientA.lastPartners.size - clientB.lastPartners.size;
            }
            return 0;
        });

        for (let i = 0; i < availableClients.length; i++) {
            const id1 = availableClients[i];
            if (paired.has(id1)) continue;

            let bestScore = -Infinity;
            let bestPartner = null;

            for (let j = i + 1; j < availableClients.length; j++) {
                const id2 = availableClients[j];
                if (paired.has(id2)) continue;

                const score = this.calculatePairingScore(id1, id2);
                if (score > bestScore) {
                    bestScore = score;
                    bestPartner = id2;
                }
            }

            if (bestPartner) {
                pairs.push([id1, bestPartner]);
                paired.add(id1);
                paired.add(bestPartner);
            }
        }

        return pairs;
    }

    calculatePairingScore(id1: string, id2: string) {
        const c1 = this.clients.get(id1);
        const c2 = this.clients.get(id2);

        let score = 1000;

        // heavily penalize if they've met before
        if (c1 && c2 && c1.lastPartners.has(id2)) {
            score -= 500;

            const clientCount = this.clients.size;
            const idealMeetingInterval = clientCount - 1;
            const roundsSinceLastMeeting = this.roundNumber -
                Math.max(c1.joinedAt, c2.joinedAt);

            if (roundsSinceLastMeeting < idealMeetingInterval) {
                score -= (idealMeetingInterval - roundsSinceLastMeeting) * 10;
            }
        }

        // prioritize pairing people who have met fewer others
        if (c1 && c2) {
            score -= (c1.lastPartners.size + c2.lastPartners.size) * 5;
        }

        return score;
    }

    getCurrentPairings(includeData = false) {
        const result = [];
        const added = new Set();

        for (const [id1, id2] of this.currentPairings.entries()) {
            if (!added.has(id1) && !added.has(id2)) {
                if (includeData) {
                    result.push([
                        { id: id1, data: this.clients.get(id1)?.data ?? null },
                        { id: id2, data: this.clients.get(id2)?.data ?? null }
                    ]);
                } else {
                    result.push([id1, id2]);
                }
                added.add(id1);
                added.add(id2);
            }
        }

        return result;
    }

    getAllClients(includeData = false) {
        if (!includeData) {
            return Array.from(this.clients.keys());
        }

        return Array.from(this.clients.entries()).map(([id, client]) => {
            return { id, data: client.data };
        });
    }

    getClientCount() {
        return this.clients.size;
    }

    shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
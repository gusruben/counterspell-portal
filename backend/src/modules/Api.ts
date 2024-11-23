import express from "express"
import type { clientList } from "../../types";
import type { CounterspellClient } from "./CounterspellClient";

const DEMO = process.env.DEMO === "true" ? true : false;
const ADMINKEY = process.env.ADMINKEY ?? "portalspell"
console.log("Admin key:", ADMINKEY)

function weightedAverage (content: number[], weights: number[]) : number {
    return content.reduce((previous, current, idx) => {
        return previous + (current * weights[idx])
    }, 0)
}

function gradeComptability (primary: CounterspellClient, secondary: CounterspellClient) {
    let content = [];

    content[0] = (()=> {
        let count = 0;

        for (const connection of secondary.history) {
            if (connection == primary.id) {
                count++;
            }
        }

        return count
    })()

    content[1] = Math.floor(Math.random() * 10) + 1

    return weightedAverage(content, [
        -0.5, // Previous connection count
        1.5, // Random value
    ])
}

export default (clients: clientList) => {
    const app = express();

    let intervalHandle: NodeJS.Timer | undefined;
    let lastRefresh: number | undefined;

    const refreshConnections = () => {
        for (const client of Object.values(clients)) {
            if (client.partner) {
                client.disconnect(`Matching with a new event...`)
            }
        }

        let availableClients = { ...clients };
        const availableClientIds = Object.keys(availableClients);

        for (const clientId of availableClientIds) {
            const client = availableClients[clientId];
            if (client.partner) continue;

            let topScore = Number.MIN_VALUE;
            let topMatchId: string | undefined;

            for (const otherClientId of availableClientIds) {
                if (otherClientId === clientId) continue;
                const otherClient = availableClients[otherClientId];

                if (client.city === otherClient.city) continue; // Skip same city

                const score = gradeComptability(client, otherClient);

                if (score > topScore) {
                    topScore = score;
                    topMatchId = otherClientId;
                }
            }

            if (topMatchId) {
                const topMatch = availableClients[topMatchId];
                client.connect(topMatch);

                delete availableClients[clientId];
                delete availableClients[topMatchId];
            }
        }

        lastRefresh = Date.now();
    }

    const intervalMilliseconds = 900000; // 15 minutes

    if (!DEMO) {
        refreshConnections();
        intervalHandle = setInterval(refreshConnections, intervalMilliseconds);
    }

    app.get(`/startTimer`, function(req, res) {
        if(!DEMO) {
            if (req.headers["Authorization"] != ADMINKEY) return res.status(403).json({
                success: false,
                message: "unauthorized request"
            });
        }

        if (!intervalHandle) {
            refreshConnections();
            intervalHandle = setInterval(refreshConnections, intervalMilliseconds);
        }

        return res.json({success: true})
    })

    app.get(`/lastRefresh`, function(req, res) {
        return res.json({success: true, refresh: lastRefresh})
    })

    app.listen(process.env.PORT || 8081, () => {
        console.log(`Backend controls running on ${process.env.PORT || 8081}`)
    })
}
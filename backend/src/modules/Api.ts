import express from "express"
import type { clientList } from "../../types";
import type { CounterspellClient } from "./CounterspellClient";

const DEMO = process.env.DEMO ?? true
const ADMINKEY = process.env.ADMINKEY ?? "portalspell"

// Overkill rn but I think we'll be adding more paramater for mathing events
function weightedAverage (content: number[], weights: number[]) : number {
    if (weights.reduce((previous, current) => {return previous + current}) != 1) throw new Error("Weights don't add up to 100%, weighted average would be invalid");
    return content.reduce((previous, current, idx) => {
        return previous + (current * weights[idx])
    })
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
        -.5, // Previous connection count
        1.5, // Random value
    ])
}

export default (clients: clientList) => {
    const app = express();

    let internval: Timer | undefined;
    let lastRefresh: number | undefined;

    const refreshConnections = () => {
        // Typescript is causing problems with for .. of so using in for now, if you know how fix please

        for (const _client in clients) {

            //Typing patch for above
            const client: CounterspellClient = clients[_client];

            if (client.partner) {
                client.disconnect(`Matching with a new event...`)
            }
        }

        
        let availableClients = {...clients}

        for (const _client in clients) {

            //Typing patch for above
            const client: CounterspellClient = clients[_client];

            if(client.partner) continue;

            let topScore = Number.MIN_VALUE;
            let topMatch: CounterspellClient | undefined;

            //@ts-ignore
            for(const _checker of availableClients) {

                const checker: CounterspellClient = _checker;

                const score = gradeComptability(client, checker);

                if (score > topScore) {
                    topScore = score; topMatch = checker;
                }
            }

            if (topMatch) {
                client.connect(topMatch)
                delete availableClients[topMatch.id];
            }
        }

        lastRefresh = Date.now();
    }

    app.get(`/startTimer`, function(req, res) {
        if(!DEMO) {
            if (req.headers["authorization"] != ADMINKEY) return res.status(403).json({
                success: false,
                message: "unauthorized request"
            });
        }

        refreshConnections();

        internval = setInterval(refreshConnections, 900000);

        return res.json({success: true})
    })

    app.get(`/lastRefresh`, function(req, res) {
        return res.json({success: true, refresh: lastRefresh})
    })

    app.listen(process.env.PORT || 8081, () => {
        console.log(`Backend controls running on ${process.env.PORT || 8081}`)
    })
}
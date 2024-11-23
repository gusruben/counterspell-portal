import express from "express"
import bodyParser from "body-parser";
import type { clientList } from "../../types";
import type { CounterspellClient } from "./CounterspellClient";
import fs from "fs";

const DEMO = process.env.DEMO === "true" ? true : false;
const ADMINKEY = process.env.ADMINKEY ?? "portalspell"
const switchInterval = process.env.INTERVAL ?? 15

const MESSAGE_FILE_PATH  = __dirname + "/messages.json";
let MESSAGES: {[key: number]: string};
if (!fs.existsSync(MESSAGE_FILE_PATH)) {
    MESSAGES = {};
    fs.writeFileSync(MESSAGE_FILE_PATH, JSON.stringify(MESSAGES));
} else {
    MESSAGES = JSON.parse(fs.readFileSync(MESSAGE_FILE_PATH).toString());
}

function weightedAverage (content: number[], weights: number[]) : number {
    return content.reduce((previous, current, idx) => {
        return previous + (current * weights[idx])
    }, 0)
}

function gradeComptability (primary: CounterspellClient, secondary: CounterspellClient) {
    let content = [];

    /*
    content[0] = (()=> {
        let count = 0;

        for (const connection of secondary.history) {
            if (connection == primary.id) {
                count++;
            }
        }
        return count
    })()

    content[1] = Math.floor(Math.random() * 50) + 1

    return weightedAverage(content, [
        -2, // Previous connection count
        1, // Random value
    ])

    */

    return Math.floor(Math.random() * 50) + 1;
}

export default (clients: clientList) => {
    const app = express();
    app.use(bodyParser.text());
    console.log("Admin key:", ADMINKEY)

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

            if(!client) continue;
            if (client.partner) continue;

            let topScore = Number.MIN_VALUE;
            let topMatchId: string | undefined;

            for (const otherClientId of availableClientIds) {
                if (otherClientId === clientId) continue;
                const otherClient = availableClients[otherClientId];

                if(!client || !otherClient) continue;
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

                console.log(`Top match found for ${client.id} was ${topMatchId}, score was ${topScore}`)

                delete availableClients[clientId];
                delete availableClients[topMatchId];
            }
        }

        lastRefresh = Date.now();
    }

    const intervalMilliseconds = (switchInterval * 60) * 1000; // 15 minutes = 900000, set to 30 secs for testing

    if (!DEMO) {
        refreshConnections();
        intervalHandle = setInterval(refreshConnections, intervalMilliseconds);
    }

    // app.get(`/startTimer`, function(req, res) {
    //     if(!DEMO) {
    //         console.log(`unauthorized '${req.headers["Authorization"]} != ${ADMINKEY}'`)
    //         if (req.headers["Authorization"] != ADMINKEY) return res.status(403).json({
    //             success: false,
    //             message: "unauthorized request"
    //         });
    //     }

    //     if (!intervalHandle) {
    //         refreshConnections();
    //         intervalHandle = setInterval(refreshConnections, intervalMilliseconds);
    //     }

    //     return res.json({success: true})
    // })

    app.get(`/lastRefresh`, function(req, res) {
        res.set('Access-Control-Allow-Origin', '*');
        return res.json({success: true, refresh: lastRefresh})
    })

    app.get("/messages", (req, res) => {
        return res.json(JSON.parse(fs.readFileSync(MESSAGE_FILE_PATH).toString()));
    })
    app.post("/messages", (req, res) => {
        if (req.headers["authorization"] != ADMINKEY) return res.status(403).json({
            success: false,
            message: "unauthorized request"
        });

        const msg = req.body;
        console.log("got a new message!", msg)

        MESSAGES[Date.now()] = msg;
        fs.writeFileSync(MESSAGE_FILE_PATH, JSON.stringify(MESSAGES));

        return res.json({success: true})
    })

    app.listen(process.env.PORT || 8081, () => {
        console.log(`Backend controls running on ${process.env.PORT || 8081}`)
    })
}
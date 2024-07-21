import express, {json} from 'express';
import http from 'http';
import {WebSocketServer} from 'ws';
import path from 'path';
import {fileURLToPath} from 'url';
import crypto from 'crypto';
import {ClientID} from '../core/GameStateApi';
import WebSocket from 'ws';
import {ClientIntentMessageSchema, ClientMessage, ClientMessageSchema, Hi, Intent, ServerMessage, ServerMessageSchema, ServerSyncMessage, ServerSyncMessageSchema, SpawnIntentSchema} from '../core/Schemas';
import {TerrainMapImpl} from '../core/GameStateImpl';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});

const clients: Map<ClientID, WebSocket> = new Map()
let intents: Intent[] = []

// Serve static files from the 'out' directory
app.use(express.static(path.join(__dirname, '../../out')));

wss.on('connection', (ws) => {
    console.log('New client connected');
    const clientID = generateUniqueId()
    clients.set(clientID, ws)
    console.log(`clients: ${clients.size}`)

    ws.on('message', (message: string) => {
        console.log(`got message ${message}`)
        const clientMsg: ClientMessage = ClientIntentMessageSchema.parse(JSON.parse(message))
        if (clientMsg.type == "intent") {
            intents.push(clientMsg.intent)
        }
    })
});

function runGame() {
    setInterval(() => tick(), 1000);
}

function tick() {
    console.log('ticking!')
    //console.log(`clients: ${clients.size}`)
    const sync = JSON.stringify(
        ServerSyncMessageSchema.parse({
            type: 'sync',
            intents: intents
        })
    )
    intents = []
    for (const [clientId, ws] of clients) {
        // console.log(`Client ID: ${clientId}`);
        //console.log(`sending sync ${sync}`)
        ws.send(sync)
        // Do something with the WebSocket (ws)
    }
}

const PORT = process.env.PORT || 3000;
console.log(`Server will try to run on http://localhost:${PORT}`);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

runGame()

function generateUniqueId(): string {
    return crypto.randomBytes(16).toString('hex');
}

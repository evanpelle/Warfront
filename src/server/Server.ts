import express, {json} from 'express';
import http from 'http';
import {WebSocketServer} from 'ws';
import path from 'path';
import {fileURLToPath} from 'url';
import {GameManager} from './GameManager';
import {Client} from './Client';
import {ClientMessage, ClientMessageSchema} from '../core/Schemas';
import {Lobby} from './Lobby';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});


// Serve static files from the 'out' directory
app.use(express.static(path.join(__dirname, '../../out')));
app.use(express.json())

const gm = new GameManager()

// New GET endpoint to list lobbies
app.get('/lobbies', (req, res) => {
    const lobbyList = Array.from(gm.lobbies()).map(lobby => ({
        id: lobby.id,
    }));

    res.json({
        lobbies: lobbyList,
    });
});

wss.on('connection', (ws) => {

    ws.on('message', (message: string) => {
        console.log(`got message ${message}`)
        const clientMsg: ClientMessage = ClientMessageSchema.parse(JSON.parse(message))
        if (clientMsg.type == "join") {
            gm.addClientToLobby(new Client(clientMsg.clientID, ws), clientMsg.lobbyID)
        }
    })

});

function runGame() {
    gm.addLobby(new Lobby("123", 10 * 1000))
    setInterval(() => tick(), 1000);
}

function tick() {
    gm.tick()
}

const PORT = process.env.PORT || 3000;
console.log(`Server will try to run on http://localhost:${PORT}`);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

runGame()


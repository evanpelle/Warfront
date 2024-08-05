import {ClientID} from "../core/Game";
import WebSocket from 'ws';


export class Client {
    constructor(public readonly id: ClientID, public readonly ws: WebSocket) { }
}
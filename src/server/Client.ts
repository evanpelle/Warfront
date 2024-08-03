import {ClientID} from "../core/GameApi";
import WebSocket from 'ws';


export class Client {
    constructor(public readonly id: ClientID, public readonly ws: WebSocket) { }
}
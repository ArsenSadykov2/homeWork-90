import express from 'express';
import expressWs from "express-ws";
import cors from "cors";
import WebSocket from "ws";

const app = express();
const wsInstance = expressWs(app);

const port = 8000;
app.use(cors());

interface Pixel {
    x: number;
    y: number;
    color: string;
}

interface ChatMessage {
    username: string;
    text: string;
}

interface IncomingMessage {
    type: string;
    payload: Pixel | string | ChatMessage;
}


const router = express.Router();
wsInstance.applyTo(router);

const chatClients: WebSocket[] = [];
const drawClients: WebSocket[] = [];
const pixels: Pixel[] = [];


router.ws('/chat', (ws, req) => {
    console.log('Client connected');
    let username = 'Anonymous';

    chatClients.push(ws);
    console.log('Total connections: ' + chatClients.length);


    ws.on('message', (message) => {
        try{
            const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;
            console.log(decodedMessage);

            if(decodedMessage.type === 'SEND_MESSAGE') {
                chatClients.forEach(clientWs => {
                    clientWs.send(JSON.stringify({
                        type: "NEW_MESSAGE",
                        payload: {username: username, text: decodedMessage.payload}
                    }));
                });
            } else if(decodedMessage.type === 'SET_USERNAME') {
                username = decodedMessage.payload as string;
            }
        }catch(e){
            ws.send(JSON.stringify({error: 'Invalid message'}));
        }
    });

    ws.on('close', (message) => {
        console.log('Client disconnected');
        const index = chatClients.indexOf(ws);
        chatClients.splice(index, 1);
        console.log('Total connections: ' + chatClients.length);
    });
});



app.use(router);
app.listen(port, () => console.log(`Server started on port ${port}`));
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

router.ws('/draw', (ws, req) => {
    console.log('Drawing client connected');
    drawClients.push(ws);

    ws.send(JSON.stringify({
        type: 'INIT_PIXELS',
        payload: pixels
    }));

    ws.on('message', (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

            if (decodedMessage.type === 'ADD_PIXEL') {
                const pixel = decodedMessage.payload as Pixel;
                pixels.push(pixel);

                drawClients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'NEW_PIXEL',
                            payload: pixel
                        }));
                    }
                });
            }
        } catch (e) {
            console.error('Error processing message:', e);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        console.log('Drawing client disconnected');
        const index = drawClients.indexOf(ws);
        if (index !== -1) {
            drawClients.splice(index, 1);
        }
        console.log('Total drawing connections: ' + drawClients.length);
    });
});


app.use(router);
app.listen(port, () => console.log(`Server started on port ${port}`));
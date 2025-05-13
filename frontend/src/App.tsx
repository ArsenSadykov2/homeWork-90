import './App.css'
import {useEffect, useRef, useState} from "react";
import type {ChatMessage, Pixel} from "./types";

const App = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [usernameInput, setUsernameInput] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#d80606');

    const chatWs = useRef<WebSocket | null>(null);
    const drawWs = useRef<WebSocket | null>(null);

    const drawPixel = (pixel: Pixel) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, 1, 1);
    };

    const drawPixels = (pixels: Pixel[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pixels.forEach(pixel => {
            drawPixel(pixel);
        });
    };

    const startDrawing = (e: React.MouseEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current || !drawWs.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newPixel = { x, y, color };
        drawPixel(newPixel);

        drawWs.current.send(JSON.stringify({
            type: 'ADD_PIXEL',
            payload: newPixel,
        }));
    };

    useEffect(() => {
        drawWs.current = new WebSocket('ws://localhost:8000/draw');
        drawWs.current.onclose = () => console.log('Drawing WS Connection closed');
        drawWs.current.onmessage = event => {
            const decodedMessage = JSON.parse(event.data);

            if (decodedMessage.type === 'INIT_PIXELS') {
                drawPixels(decodedMessage.payload);
            } else if (decodedMessage.type === 'NEW_PIXEL') {
                drawPixel(decodedMessage.payload);
            }
        };

        chatWs.current = new WebSocket('ws://localhost:8000/chat');
        chatWs.current.onclose = () => console.log('Chat WS Connection closed');
        chatWs.current.onmessage = event => {
            const decodedMessage = JSON.parse(event.data);

            if (decodedMessage.type === 'NEW_MESSAGE') {
                setMessages(prev => [...prev, decodedMessage.payload]);
            }
        };

        return() => {
            if(drawWs.current ) {
                drawWs.current.close();
            }
            if(chatWs.current) {
                chatWs.current.close();
            }
        }
    }, []);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if(!chatWs.current) return;

        chatWs.current.send(JSON.stringify({
            type: "SEND_MESSAGE",
            payload: messageInput,
        }));
    }

    const setUsername = (e: React.FormEvent) => {
        e.preventDefault();
        if(!chatWs.current) return;

        chatWs.current.send(JSON.stringify({
            type: "SET_USERNAME",
            payload: usernameInput,
        }));

        setIsLoggedIn(true);
    }

    let chat = (
        <>
            {messages.map((message, index) => (
                <div key={index}>
                    <b>{message.username}: {message.text}</b>
                </div>
            ))}

            <form onSubmit={sendMessage}>
                <div>
                    <div>
                        <label>Цвет: </label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onMouseDown={startDrawing}
                        onMouseUp={endDrawing}
                        onMouseMove={draw}
                        onMouseLeave={endDrawing}
                        style={{border: '1px solid black', cursor: 'cell'}}
                    />
                </div>
                <button type="submit">Send</button>
            </form>
        </>
    )

    if (!isLoggedIn) {
        chat = (
            <form onSubmit={setUsername}>
                <div>
                    <input
                        type="text"
                        placeholder="Введите имя"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        required
                    />
                    <div>
                        <label>Цвет: </label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        onMouseDown={startDrawing}
                        onMouseUp={endDrawing}
                        onMouseMove={draw}
                        onMouseLeave={endDrawing}
                        style={{border: '1px solid black', cursor: 'cell'}}
                    />
                </div>
                <button type="submit">Send</button>
            </form>
        )
    }

    return (
        <>
            {chat}
        </>
    )
}

export default App


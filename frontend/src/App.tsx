import './App.css'
import {useEffect, useRef, useState} from "react";
import type {ChatMessage, IncomingMessage} from "./types";

const App = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [usernameIpunt, setUsernameIpunt] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);


    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8000/chat');

        ws.current.onclose = () => console.log('WS Connection closed');

        ws.current.onmessage = event => {
            const decodedMessage = JSON.parse(event.data) as IncomingMessage;

            if(decodedMessage.type === 'NEW_MESSAGE') {
                setMessages(prevState => [decodedMessage.payload, ...prevState])
            }
        };

        return() => {
            if(ws.current) {
                ws.current.close();
            }
        }
    }, []);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if(!ws.current) return;

        ws.current.send(JSON.stringify({
            type: "SEND_MESSAGE",
            payload: messageInput,
        }));
    }

    const setUsername = (e: React.FormEvent) => {
        e.preventDefault();
        if(!ws.current) return;

        ws.current.send(JSON.stringify({
            type: "SET_USERNAME",
            payload: usernameIpunt,
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
                <input
                    type="text"
                    name="messageText"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
        </>
    )

    if (!isLoggedIn) {
        chat = (
            <form onSubmit={setUsername}>
                <input
                    type="text"
                    name="username"
                    value={usernameIpunt}
                    onChange={(e) => setUsernameIpunt(e.target.value)}
                />
                <button type="submit">Send</button>
            </form>
        )
    }

    return (
        <>
            {chat}
            <canvas id="myCanvas" width="500" height="500"></canvas>
        </>
    )
}

export default App

export interface ChatMessage {
    username: string;
    text: string;
}

export interface IncomingMessage {
    type: string;
    payload: ChatMessage;
}

export interface Pixel {
    x: number;
    y: number;
    color: string;
}
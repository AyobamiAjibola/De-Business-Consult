import {
    DEAD_LETTER_QUEUE, 
    QUEUE_EVENTS_CHAT, 
    QUEUE_EVENTS_CHAT_SEEN, 
    QUEUE_EVENTS_EMAIL, 
    QUEUE_EVENTS_PAYMENT,
    QUEUE_EVENTS_CALENDLY
} from "./constants";
import RabbitMQService from "../services/RabbitMQService";

const rabbitMqService = new RabbitMQService(
    QUEUE_EVENTS_PAYMENT.name, 
    QUEUE_EVENTS_EMAIL.name, 
    DEAD_LETTER_QUEUE.name,
    QUEUE_EVENTS_CHAT.name,
    QUEUE_EVENTS_CHAT_SEEN.name,
    QUEUE_EVENTS_CALENDLY.name
);

export default rabbitMqService;
import { DEAD_LETTER_QUEUE, QUEUE_EVENTS_EMAIL, QUEUE_EVENTS_PAYMENT } from "./constants";
import RabbitMQService from "../services/RabbitMQService";

const rabbitMqService = new RabbitMQService(QUEUE_EVENTS_PAYMENT.name, QUEUE_EVENTS_EMAIL.name, DEAD_LETTER_QUEUE.name);

export default rabbitMqService;
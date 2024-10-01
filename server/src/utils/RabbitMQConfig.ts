import { QUEUE_EVENTS_PAYMENT } from "../config/constants";
import RabbitMQService from "../services/RabbitMQService";

const rabbitMqService = new RabbitMQService(QUEUE_EVENTS_PAYMENT.name);

export default rabbitMqService;
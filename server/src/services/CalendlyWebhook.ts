import RabbitMQService from './RabbitMQService';
import { QUEUE_EVENTS_CALENDLY } from '../config/constants';

class CalendlyWebhook {
    private rabbitMQService: RabbitMQService;

    constructor(rabbitMQService: RabbitMQService) {
        this.rabbitMQService = rabbitMQService;
    }

    public async handleCalendlyEvent(event: any): Promise<{ status: string; message: string }> {
        try {
            await this.rabbitMQService.publishMessageToQueue(QUEUE_EVENTS_CALENDLY.name, event)
            return { status: 'success', message: 'Event published to RabbitMQ for processing' };
        } catch (error) {
            console.error('Error publishing to RabbitMQ:', error);
            return { status: 'error', message: 'Failed to publish event to RabbitMQ' };
        }
    }
}

export default CalendlyWebhook;
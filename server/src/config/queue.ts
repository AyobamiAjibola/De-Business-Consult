import {connect} from 'amqplib';
import settings from './settings';

// @ts-ignore
const config = settings.queue[settings.service.env];

export default {
  client: async () => connect(config.host),
};

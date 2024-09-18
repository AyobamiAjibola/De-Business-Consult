import { Model, Types } from 'mongoose';
import ChatMessage, { IChatMessageModel } from '../models/ChatMessages';
import CrudRepository from '../helpers/CrudRepository';

export default class ChatMessageRepository extends CrudRepository<IChatMessageModel, Types.ObjectId> {
  constructor() {
    super(ChatMessage as Model<IChatMessageModel>);
  }
}
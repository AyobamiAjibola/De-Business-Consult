import { Model, Types } from 'mongoose';
import Chat, {IChatModel} from '../models/ChatModel';
import CrudRepository from '../helpers/CrudRepository';

export default class ChatRepository extends CrudRepository<IChatModel, Types.ObjectId> {
  constructor() {
    super(Chat as Model<IChatModel>);
  }
}
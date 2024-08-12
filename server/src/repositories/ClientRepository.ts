import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Client, { IClientModel } from '../models/Client';

export default class ClientRepository extends CrudRepository<IClientModel, Types.ObjectId> {
  constructor() {
    super(Client as Model<IClientModel>);
  }
}
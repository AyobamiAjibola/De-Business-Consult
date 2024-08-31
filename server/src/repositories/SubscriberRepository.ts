import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Subscriber, { ISubscriberModel } from '../models/Subscriber';

export default class SubscriberRepository extends CrudRepository<ISubscriberModel, Types.ObjectId> {
  constructor() {
    super(Subscriber as Model<ISubscriberModel>);
  }
}
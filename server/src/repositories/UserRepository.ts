import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import User, { IUserModel } from '../models/User';

export default class UserRepository extends CrudRepository<IUserModel, Types.ObjectId> {
  constructor() {
    super(User as Model<IUserModel>);
  }
}
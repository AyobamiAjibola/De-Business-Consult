import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import SignUpAtempt, { ISignUpAtemptModel } from '../models/SignUpAtempt';

export default class SignUpAtemptRepository extends CrudRepository<ISignUpAtemptModel, Types.ObjectId> {
  constructor() {
    super(SignUpAtempt as Model<ISignUpAtemptModel>);
  }
}
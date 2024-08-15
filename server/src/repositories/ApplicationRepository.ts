import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Application, { IApplicationModel } from '../models/Application';

export default class ApplicationRepository extends CrudRepository<IApplicationModel, Types.ObjectId> {
  constructor() {
    super(Application as Model<IApplicationModel>);
  }
}
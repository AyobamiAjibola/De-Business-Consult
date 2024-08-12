import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Services, { IServicesModel } from '../models/Services';

export default class ServicesRepository extends CrudRepository<IServicesModel, Types.ObjectId> {
  constructor() {
    super(Services as Model<IServicesModel>);
  }
}
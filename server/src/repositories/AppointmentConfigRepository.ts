import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import AppointmentConfig, { IAppointmentConfigModel } from '../models/AppointmentConfig';

export default class AppointmentConfigRepository extends CrudRepository<IAppointmentConfigModel, Types.ObjectId> {
  constructor() {
    super(AppointmentConfig as Model<IAppointmentConfigModel>);
  }
}
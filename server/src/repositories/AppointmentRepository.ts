import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Appointment, { IAppointmentModel } from '../models/Appointment';

export default class AppointmentRepository extends CrudRepository<IAppointmentModel, Types.ObjectId> {
  constructor() {
    super(Appointment as Model<IAppointmentModel>);
  }
}
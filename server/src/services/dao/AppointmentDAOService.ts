import { FilterQuery, UpdateQuery, QueryOptions, UpdateWriteOpResult } from 'mongoose';
import {IAppointmentModel} from '../../models/Appointment';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import AppointmentRepository from '../../repositories/AppointmentRepository';

export default class AppointmentDAOService implements ICrudDAO<IAppointmentModel> {
  private appointmentRepository: AppointmentRepository;

  constructor(appointmentRepository: AppointmentRepository) {
    this.appointmentRepository = appointmentRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IAppointmentModel>): Promise<IAppointmentModel[]> {
    return this.appointmentRepository.bulkCreate(records)
  }

  create(values: IAppointmentModel): Promise<IAppointmentModel> {
    return this.appointmentRepository.save(values);
  }

  findAll(filter?: FilterQuery<IAppointmentModel>, options?: QueryOptions): Promise<IAppointmentModel[]> {
    return this.appointmentRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IAppointmentModel | null> {
    return this.appointmentRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IAppointmentModel>, options?: QueryOptions): Promise<IAppointmentModel | null> {
    return this.appointmentRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IAppointmentModel>, options: QueryOptions): Promise<IAppointmentModel | null> {
    return this.appointmentRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IAppointmentModel>,
    update: UpdateQuery<IAppointmentModel>,
    options?: QueryOptions
  ): Promise<IAppointmentModel | null> {
    return this.appointmentRepository.updateByAny(filter, update, options)
  }

  updateMany(
    filter: FilterQuery<IAppointmentModel>, 
    update: UpdateQuery<IAppointmentModel>, 
    options?: QueryOptions): Promise<UpdateWriteOpResult> 
  {
    return this.appointmentRepository.updateMany(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IAppointmentModel>, options?: QueryOptions): Promise<void> {
    return this.appointmentRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.appointmentRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.appointmentRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IAppointmentModel>, options?: QueryOptions): Promise<boolean> {
    return this.appointmentRepository.exist(filter, options);
  }

}
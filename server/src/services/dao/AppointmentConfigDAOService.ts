import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IAppointmentConfigModel} from '../../models/AppointmentConfig';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import AppointmentConfigRepository from '../../repositories/AppointmentConfigRepository';

export default class AppointmentConfigDAOService implements ICrudDAO<IAppointmentConfigModel> {
  private appointmentConfigRepository: AppointmentConfigRepository;

  constructor(appointmentConfigRepository: AppointmentConfigRepository) {
    this.appointmentConfigRepository = appointmentConfigRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IAppointmentConfigModel>): Promise<IAppointmentConfigModel[]> {
    return this.appointmentConfigRepository.bulkCreate(records)
  }

  create(values: IAppointmentConfigModel): Promise<IAppointmentConfigModel> {
    return this.appointmentConfigRepository.save(values);
  }

  findAll(filter?: FilterQuery<IAppointmentConfigModel>, options?: QueryOptions): Promise<IAppointmentConfigModel[]> {
    return this.appointmentConfigRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IAppointmentConfigModel | null> {
    return this.appointmentConfigRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IAppointmentConfigModel>, options?: QueryOptions): Promise<IAppointmentConfigModel | null> {
    return this.appointmentConfigRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IAppointmentConfigModel>, options: QueryOptions): Promise<IAppointmentConfigModel | null> {
    return this.appointmentConfigRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IAppointmentConfigModel>,
    update: UpdateQuery<IAppointmentConfigModel>,
    options?: QueryOptions
  ): Promise<IAppointmentConfigModel | null> {
    return this.appointmentConfigRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IAppointmentConfigModel>, options?: QueryOptions): Promise<void> {
    return this.appointmentConfigRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.appointmentConfigRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.appointmentConfigRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IAppointmentConfigModel>, options?: QueryOptions): Promise<boolean> {
    return this.appointmentConfigRepository.exist(filter, options);
  }

}
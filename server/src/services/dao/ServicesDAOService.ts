import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IServicesModel} from '../../models/Services';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import ServicesRepository from '../../repositories/ServicesRepository';

export default class ServicesDAOService implements ICrudDAO<IServicesModel> {
  private servicesRepository: ServicesRepository;

  constructor(servicesRepository: ServicesRepository) {
    this.servicesRepository = servicesRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IServicesModel>): Promise<IServicesModel[]> {
    return this.servicesRepository.bulkCreate(records)
  }

  create(values: IServicesModel): Promise<IServicesModel> {
    return this.servicesRepository.save(values);
  }

  findAll(filter?: FilterQuery<IServicesModel>, options?: QueryOptions): Promise<IServicesModel[]> {
    return this.servicesRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IServicesModel | null> {
    return this.servicesRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IServicesModel>, options?: QueryOptions): Promise<IServicesModel | null> {
    return this.servicesRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IServicesModel>, options: QueryOptions): Promise<IServicesModel | null> {
    return this.servicesRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IServicesModel>,
    update: UpdateQuery<IServicesModel>,
    options?: QueryOptions
  ): Promise<IServicesModel | null> {
    return this.servicesRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IServicesModel>, options?: QueryOptions): Promise<void> {
    return this.servicesRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.servicesRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.servicesRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IServicesModel>, options?: QueryOptions): Promise<boolean> {
    return this.servicesRepository.exist(filter, options);
  }

}
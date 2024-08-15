import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IApplicationModel} from '../../models/Application';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import ApplicationRepository from '../../repositories/ApplicationRepository';

export default class ApplicationDAOService implements ICrudDAO<IApplicationModel> {
  private applicationRepository: ApplicationRepository;

  constructor(applicationRepository: ApplicationRepository) {
    this.applicationRepository = applicationRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IApplicationModel>): Promise<IApplicationModel[]> {
    return this.applicationRepository.bulkCreate(records)
  }

  create(values: IApplicationModel): Promise<IApplicationModel> {
    return this.applicationRepository.save(values);
  }

  findAll(filter?: FilterQuery<IApplicationModel>, options?: QueryOptions): Promise<IApplicationModel[]> {
    return this.applicationRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IApplicationModel | null> {
    return this.applicationRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IApplicationModel>, options?: QueryOptions): Promise<IApplicationModel | null> {
    return this.applicationRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IApplicationModel>, options: QueryOptions): Promise<IApplicationModel | null> {
    return this.applicationRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IApplicationModel>,
    update: UpdateQuery<IApplicationModel>,
    options?: QueryOptions
  ): Promise<IApplicationModel | null> {
    return this.applicationRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IApplicationModel>, options?: QueryOptions): Promise<void> {
    return this.applicationRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.applicationRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.applicationRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IApplicationModel>, options?: QueryOptions): Promise<boolean> {
    return this.applicationRepository.exist(filter, options);
  }

}
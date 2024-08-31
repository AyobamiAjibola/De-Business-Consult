import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {ISubscriberModel} from '../../models/Subscriber';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import SubscriberRepository from '../../repositories/SubscriberRepository';

export default class SubscriberDAOService implements ICrudDAO<ISubscriberModel> {
  private subscriberRepository: SubscriberRepository;

  constructor(subscriberRepository: SubscriberRepository) {
    this.subscriberRepository = subscriberRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<ISubscriberModel>): Promise<ISubscriberModel[]> {
    return this.subscriberRepository.bulkCreate(records)
  }

  create(values: ISubscriberModel): Promise<ISubscriberModel> {
    return this.subscriberRepository.save(values);
  }

  findAll(filter?: FilterQuery<ISubscriberModel>, options?: QueryOptions): Promise<ISubscriberModel[]> {
    return this.subscriberRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<ISubscriberModel | null> {
    return this.subscriberRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<ISubscriberModel>, options?: QueryOptions): Promise<ISubscriberModel | null> {
    return this.subscriberRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<ISubscriberModel>, options: QueryOptions): Promise<ISubscriberModel | null> {
    return this.subscriberRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<ISubscriberModel>,
    update: UpdateQuery<ISubscriberModel>,
    options?: QueryOptions
  ): Promise<ISubscriberModel | null> {
    return this.subscriberRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<ISubscriberModel>, options?: QueryOptions): Promise<void> {
    return this.subscriberRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.subscriberRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.subscriberRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<ISubscriberModel>, options?: QueryOptions): Promise<boolean> {
    return this.subscriberRepository.exist(filter, options);
  }

}
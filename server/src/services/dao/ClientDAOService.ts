import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IClientModel} from '../../models/Client';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import ClientRepository from '../../repositories/ClientRepository';

export default class ClientDAOService implements ICrudDAO<IClientModel> {
  private clientRepository: ClientRepository;

  constructor(clientRepository: ClientRepository) {
    this.clientRepository = clientRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IClientModel>): Promise<IClientModel[]> {
    return this.clientRepository.bulkCreate(records)
  }

  create(values: IClientModel): Promise<IClientModel> {
    return this.clientRepository.save(values);
  }

  findAll(filter?: FilterQuery<IClientModel>, options?: QueryOptions): Promise<IClientModel[]> {
    return this.clientRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IClientModel | null> {
    return this.clientRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IClientModel>, options?: QueryOptions): Promise<IClientModel | null> {
    return this.clientRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IClientModel>, options: QueryOptions): Promise<IClientModel | null> {
    return this.clientRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IClientModel>,
    update: UpdateQuery<IClientModel>,
    options?: QueryOptions
  ): Promise<IClientModel | null> {
    return this.clientRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IClientModel>, options?: QueryOptions): Promise<void> {
    return this.clientRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.clientRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.clientRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IClientModel>, options?: QueryOptions): Promise<boolean> {
    return this.clientRepository.exist(filter, options);
  }

}
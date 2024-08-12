import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IUserModel} from '../../models/User';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import UserRepository from '../../repositories/UserRepository';

export default class UserDAOService implements ICrudDAO<IUserModel> {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IUserModel>): Promise<IUserModel[]> {
    return this.userRepository.bulkCreate(records)
  }

  create(values: IUserModel): Promise<IUserModel> {
    return this.userRepository.save(values);
  }

  findAll(filter?: FilterQuery<IUserModel>, options?: QueryOptions): Promise<IUserModel[]> {
    return this.userRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IUserModel | null> {
    return this.userRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IUserModel>, options?: QueryOptions): Promise<IUserModel | null> {
    return this.userRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IUserModel>, options: QueryOptions): Promise<IUserModel | null> {
    return this.userRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IUserModel>,
    update: UpdateQuery<IUserModel>,
    options?: QueryOptions
  ): Promise<IUserModel | null> {
    return this.userRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IUserModel>, options?: QueryOptions): Promise<void> {
    return this.userRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.userRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.userRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IUserModel>, options?: QueryOptions): Promise<boolean> {
    return this.userRepository.exist(filter, options);
  }

}
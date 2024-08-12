import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {ISignUpAtemptModel} from '../../models/SignUpAtempt';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import SignUpAtemptRepository from '../../repositories/SignUpAtemptRepository';

export default class SignUpAtemptDAOService implements ICrudDAO<ISignUpAtemptModel> {
  private signUpAtemptRepository: SignUpAtemptRepository;

  constructor(signUpAtemptRepository: SignUpAtemptRepository) {
    this.signUpAtemptRepository = signUpAtemptRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<ISignUpAtemptModel>): Promise<ISignUpAtemptModel[]> {
    return this.signUpAtemptRepository.bulkCreate(records)
  }

  create(values: ISignUpAtemptModel): Promise<ISignUpAtemptModel> {
    return this.signUpAtemptRepository.save(values);
  }

  findAll(filter?: FilterQuery<ISignUpAtemptModel>, options?: QueryOptions): Promise<ISignUpAtemptModel[]> {
    return this.signUpAtemptRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<ISignUpAtemptModel | null> {
    return this.signUpAtemptRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<ISignUpAtemptModel>, options?: QueryOptions): Promise<ISignUpAtemptModel | null> {
    return this.signUpAtemptRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<ISignUpAtemptModel>, options: QueryOptions): Promise<ISignUpAtemptModel | null> {
    return this.signUpAtemptRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<ISignUpAtemptModel>,
    update: UpdateQuery<ISignUpAtemptModel>,
    options?: QueryOptions
  ): Promise<ISignUpAtemptModel | null> {
    return this.signUpAtemptRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<ISignUpAtemptModel>, options?: QueryOptions): Promise<void> {
    return this.signUpAtemptRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.signUpAtemptRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.signUpAtemptRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<ISignUpAtemptModel>, options?: QueryOptions): Promise<boolean> {
    return this.signUpAtemptRepository.exist(filter, options);
  }

}
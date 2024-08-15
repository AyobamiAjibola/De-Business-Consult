import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {ITransactionModel} from '../../models/Transaction';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import TransactionRepository from '../../repositories/TransactionRepository';

export default class TransactionDAOService implements ICrudDAO<ITransactionModel> {
  private transactionRepository: TransactionRepository;

  constructor(transactionRepository: TransactionRepository) {
    this.transactionRepository = transactionRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<ITransactionModel>): Promise<ITransactionModel[]> {
    return this.transactionRepository.bulkCreate(records)
  }

  create(values: ITransactionModel): Promise<ITransactionModel> {
    return this.transactionRepository.save(values);
  }

  findAll(filter?: FilterQuery<ITransactionModel>, options?: QueryOptions): Promise<ITransactionModel[]> {
    return this.transactionRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<ITransactionModel | null> {
    return this.transactionRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<ITransactionModel>, options?: QueryOptions): Promise<ITransactionModel | null> {
    return this.transactionRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<ITransactionModel>, options: QueryOptions): Promise<ITransactionModel | null> {
    return this.transactionRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<ITransactionModel>,
    update: UpdateQuery<ITransactionModel>,
    options?: QueryOptions
  ): Promise<ITransactionModel | null> {
    return this.transactionRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<ITransactionModel>, options?: QueryOptions): Promise<void> {
    return this.transactionRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.transactionRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.transactionRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<ITransactionModel>, options?: QueryOptions): Promise<boolean> {
    return this.transactionRepository.exist(filter, options);
  }

}

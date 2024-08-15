import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Transaction, { ITransactionModel } from '../models/Transaction';

export default class TransactionRepository extends CrudRepository<ITransactionModel, Types.ObjectId> {
  constructor() {
    super(Transaction as Model<ITransactionModel>);
  }
}
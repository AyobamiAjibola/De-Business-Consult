import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import NewsLetter, { INewsLetterModel } from '../models/NewsLetter';

export default class NewsLetterRepository extends CrudRepository<INewsLetterModel, Types.ObjectId> {
  constructor() {
    super(NewsLetter as Model<INewsLetterModel>);
  }
}
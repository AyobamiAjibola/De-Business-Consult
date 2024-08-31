import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Author, { IAuthorModel } from '../models/Author';

export default class AuthorRepository extends CrudRepository<IAuthorModel, Types.ObjectId> {
  constructor() {
    super(Author as Model<IAuthorModel>);
  }
}
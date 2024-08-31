import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Blog, { IBlogModel } from '../models/Blog';

export default class BlogRepository extends CrudRepository<IBlogModel, Types.ObjectId> {
  constructor() {
    super(Blog as Model<IBlogModel>);
  }
}
import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import BlogComments, { IBlogCommentsModel } from '../models/BlogComments';

export default class BlogCommentsRepository extends CrudRepository<IBlogCommentsModel, Types.ObjectId> {
  constructor() {
    super(BlogComments as Model<IBlogCommentsModel>);
  }
}
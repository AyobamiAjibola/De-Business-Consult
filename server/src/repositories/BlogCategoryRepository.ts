import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import BlogCategory, { IBlogCategoryModel } from '../models/BlogCategory';

export default class BlogCategoryRepository extends CrudRepository<IBlogCategoryModel, Types.ObjectId> {
  constructor() {
    super(BlogCategory as Model<IBlogCategoryModel>);
  }
}
import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IBlogCommentsModel} from '../../models/BlogComments';
import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import BlogCommentsRepository from '../../repositories/BlogCommentsRepository';

export default class BlogCommentsDAOService implements ICrudDAO<IBlogCommentsModel> {
  private blogCommentRepository: BlogCommentsRepository;

  constructor(blogCommentRepository: BlogCommentsRepository) {
    this.blogCommentRepository = blogCommentRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IBlogCommentsModel>): Promise<IBlogCommentsModel[]> {
    return this.blogCommentRepository.bulkCreate(records)
  }

  create(values: IBlogCommentsModel): Promise<IBlogCommentsModel> {
    return this.blogCommentRepository.save(values);
  }

  findAll(filter?: FilterQuery<IBlogCommentsModel>, options?: QueryOptions): Promise<IBlogCommentsModel[]> {
    return this.blogCommentRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IBlogCommentsModel | null> {
    return this.blogCommentRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IBlogCommentsModel>, options?: QueryOptions): Promise<IBlogCommentsModel | null> {
    return this.blogCommentRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IBlogCommentsModel>, options: QueryOptions): Promise<IBlogCommentsModel | null> {
    return this.blogCommentRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IBlogCommentsModel>,
    update: UpdateQuery<IBlogCommentsModel>,
    options?: QueryOptions
  ): Promise<IBlogCommentsModel | null> {
    return this.blogCommentRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IBlogCommentsModel>, options?: QueryOptions): Promise<void> {
    return this.blogCommentRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.blogCommentRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.blogCommentRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IBlogCommentsModel>, options?: QueryOptions): Promise<boolean> {
    return this.blogCommentRepository.exist(filter, options);
  }

}
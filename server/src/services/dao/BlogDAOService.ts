import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IBlogModel} from '../../models/Blog';
import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import BlogRepository from '../../repositories/BlogRepository';

export default class BlogDAOService implements ICrudDAO<IBlogModel> {
  private blogRepository: BlogRepository;

  constructor(blogRepository: BlogRepository) {
    this.blogRepository = blogRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IBlogModel>): Promise<IBlogModel[]> {
    return this.blogRepository.bulkCreate(records)
  }

  create(values: IBlogModel): Promise<IBlogModel> {
    return this.blogRepository.save(values);
  }

  findAll(filter?: FilterQuery<IBlogModel>, options?: QueryOptions): Promise<IBlogModel[]> {
    return this.blogRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IBlogModel | null> {
    return this.blogRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IBlogModel>, options?: QueryOptions): Promise<IBlogModel | null> {
    return this.blogRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IBlogModel>, options: QueryOptions): Promise<IBlogModel | null> {
    return this.blogRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IBlogModel>,
    update: UpdateQuery<IBlogModel>,
    options?: QueryOptions
  ): Promise<IBlogModel | null> {
    return this.blogRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IBlogModel>, options?: QueryOptions): Promise<void> {
    return this.blogRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.blogRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.blogRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IBlogModel>, options?: QueryOptions): Promise<boolean> {
    return this.blogRepository.exist(filter, options);
  }

}
import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {INewsLetterModel} from '../../models/NewsLetter';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import NewsLetterRepository from '../../repositories/NewsLetterRepository';

export default class NewsLetterDAOService implements ICrudDAO<INewsLetterModel> {
  private newsLetterRepository: NewsLetterRepository;

  constructor(newsLetterRepository: NewsLetterRepository) {
    this.newsLetterRepository = newsLetterRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<INewsLetterModel>): Promise<INewsLetterModel[]> {
    return this.newsLetterRepository.bulkCreate(records)
  }

  create(values: INewsLetterModel): Promise<INewsLetterModel> {
    return this.newsLetterRepository.save(values);
  }

  findAll(filter?: FilterQuery<INewsLetterModel>, options?: QueryOptions): Promise<INewsLetterModel[]> {
    return this.newsLetterRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<INewsLetterModel | null> {
    return this.newsLetterRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<INewsLetterModel>, options?: QueryOptions): Promise<INewsLetterModel | null> {
    return this.newsLetterRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<INewsLetterModel>, options: QueryOptions): Promise<INewsLetterModel | null> {
    return this.newsLetterRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<INewsLetterModel>,
    update: UpdateQuery<INewsLetterModel>,
    options?: QueryOptions
  ): Promise<INewsLetterModel | null> {
    return this.newsLetterRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<INewsLetterModel>, options?: QueryOptions): Promise<void> {
    return this.newsLetterRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.newsLetterRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.newsLetterRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<INewsLetterModel>, options?: QueryOptions): Promise<boolean> {
    return this.newsLetterRepository.exist(filter, options);
  }

}
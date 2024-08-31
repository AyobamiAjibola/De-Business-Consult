import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IDeBizDocsModel} from '../../models/DeBizDocs';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import DeBizDocsRepository from '../../repositories/DeBizDocsRepository';

export default class DeBizDocsDAOService implements ICrudDAO<IDeBizDocsModel> {
  private deBizDocsRepository: DeBizDocsRepository;

  constructor(deBizDocsRepository: DeBizDocsRepository) {
    this.deBizDocsRepository = deBizDocsRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IDeBizDocsModel>): Promise<IDeBizDocsModel[]> {
    return this.deBizDocsRepository.bulkCreate(records)
  }

  create(values: IDeBizDocsModel): Promise<IDeBizDocsModel> {
    return this.deBizDocsRepository.save(values);
  }

  findAll(filter?: FilterQuery<IDeBizDocsModel>, options?: QueryOptions): Promise<IDeBizDocsModel[]> {
    return this.deBizDocsRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IDeBizDocsModel | null> {
    return this.deBizDocsRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<IDeBizDocsModel>, options?: QueryOptions): Promise<IDeBizDocsModel | null> {
    return this.deBizDocsRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IDeBizDocsModel>, options: QueryOptions): Promise<IDeBizDocsModel | null> {
    return this.deBizDocsRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IDeBizDocsModel>,
    update: UpdateQuery<IDeBizDocsModel>,
    options?: QueryOptions
  ): Promise<IDeBizDocsModel | null> {
    return this.deBizDocsRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IDeBizDocsModel>, options?: QueryOptions): Promise<void> {
    return this.deBizDocsRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.deBizDocsRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.deBizDocsRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IDeBizDocsModel>, options?: QueryOptions): Promise<boolean> {
    return this.deBizDocsRepository.exist(filter, options);
  }

}
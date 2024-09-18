import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IChatModel} from '../../models/ChatModel';
import ChatRepository from '../../repositories/ChatRepository';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;

export default class ChatDAOService implements ICrudDAO<IChatModel> {
  private chatRepository: ChatRepository;

  constructor(chatRepository: ChatRepository) {
    this.chatRepository = chatRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IChatModel>): Promise<IChatModel[]> {
    return this.chatRepository.bulkCreate(records)
  }

  create(values: IChatModel): Promise<IChatModel> {
    return this.chatRepository.save(values);
  }

  findAll(filter?: FilterQuery<IChatModel>, options?: QueryOptions): Promise<IChatModel[]> {
    return this.chatRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IChatModel | null> {
    return this.chatRepository.findById(id, options);
  }

  findByIdPopulatePermissions(id: any, options?: QueryOptions): Promise<IChatModel | null> {
    return this.chatRepository.findByIdPopulatePermissions(id, options);
  }

  findByAnyPopulatePermissions(filter: FilterQuery<IChatModel>, options?: QueryOptions): Promise<IChatModel | null> {
    return this.chatRepository.findByAnyPopulatePermissions(filter, options);
  }

  findByAny(filter: FilterQuery<IChatModel>, options?: QueryOptions): Promise<IChatModel | null> {
    return this.chatRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IChatModel>, options: QueryOptions): Promise<IChatModel | null> {
    return this.chatRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IChatModel>,
    update: UpdateQuery<IChatModel>,
    options?: QueryOptions
  ): Promise<IChatModel | null> {
    return this.chatRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IChatModel>, options?: QueryOptions): Promise<void> {
    return this.chatRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.chatRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.chatRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IChatModel>, options?: QueryOptions): Promise<boolean> {
    return this.chatRepository.exist(filter, options);
  }

}

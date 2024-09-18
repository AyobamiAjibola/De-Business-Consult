import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {IChatMessageModel} from '../../models/ChatMessages';
import ChatMessageRepository from '../../repositories/ChatMessageRepository';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;

export default class ChatMessageDAOService implements ICrudDAO<IChatMessageModel> {
  private chatMessageRepository: ChatMessageRepository;

  constructor(chatMessageRepository: ChatMessageRepository) {
    this.chatMessageRepository = chatMessageRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<IChatMessageModel>): Promise<IChatMessageModel[]> {
    return this.chatMessageRepository.bulkCreate(records)
  }

  create(values: IChatMessageModel): Promise<IChatMessageModel> {
    return this.chatMessageRepository.save(values);
  }

  findAll(filter?: FilterQuery<IChatMessageModel>, options?: QueryOptions): Promise<IChatMessageModel[]> {
    return this.chatMessageRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.findById(id, options);
  }

  findByIdPopulatePermissions(id: any, options?: QueryOptions): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.findByIdPopulatePermissions(id, options);
  }

  findByAnyPopulatePermissions(filter: FilterQuery<IChatMessageModel>, options?: QueryOptions): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.findByAnyPopulatePermissions(filter, options);
  }

  findByAny(filter: FilterQuery<IChatMessageModel>, options?: QueryOptions): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<IChatMessageModel>, options: QueryOptions): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<IChatMessageModel>,
    update: UpdateQuery<IChatMessageModel>,
    options?: QueryOptions
  ): Promise<IChatMessageModel | null> {
    return this.chatMessageRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<IChatMessageModel>, options?: QueryOptions): Promise<void> {
    return this.chatMessageRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.chatMessageRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.chatMessageRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<IChatMessageModel>, options?: QueryOptions): Promise<boolean> {
    return this.chatMessageRepository.exist(filter, options);
  }

}

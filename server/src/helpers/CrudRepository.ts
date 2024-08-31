import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, Types } from 'mongoose';
import { appModelTypes } from '../@types/app-model';
import AbstractCrudRepository = appModelTypes.AbstractCrudRepository;

export default class CrudRepository<M extends Document, Id extends Types.ObjectId> implements AbstractCrudRepository<M, Id> {
  private model: Model<M & Document>;

  constructor(model: Model<M>) {
    this.model = model;
  }

  async bulkCreate(records: ReadonlyArray<M>): Promise<Array<M>> {
    //@ts-ignore
    return this.model.insertMany(records);
  }

  async save(values: M, options?: QueryOptions): Promise<M> {
    const result = await this.model.create([values], options);
    return result[0];
  }

  async findAll(filter?: FilterQuery<M>, options?: QueryOptions & { search?: any }): Promise<Array<M>> {
    let query = filter ? this.model.find(filter) : this.model.find({}, options);

    if (options?.search && options?.searchFields) {
      const searchRegex = new RegExp(options?.search, 'i');
      const searchConditions = options.searchFields.map((field: any) => ({ [field]: searchRegex }));
      query = query.find({ $or: searchConditions });
    }

    // Sorting
    if (options?.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    // if(options?.status) {
    //   query = query.find({ status: options.status });
    // }

    // Limiting
    if (options?.limit) {
      query.limit(options.limit);
    }

    // Skipping for pagination
    if (options?.skip) {
      query.skip(options.skip);
    }

    const today = new Date();
    const isNotToday = (date: Date | string) => {
      const d = new Date(date);
      return d.getDate() !== today.getDate() || d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear();
    };

    if (options?.from && options?.to && (isNotToday(options.from) || isNotToday(options.to))) {
      query = query.find({
        createdAt: {
          $gte: new Date(options.from),
          $lte: new Date(options.to)
        }
      });
    }

    return query.exec();
  }

  async findById(id: Id, options?: QueryOptions): Promise<M | null> {
    return this.model.findById(id as any, null, options).exec();
  }

  async findByIdPopulatePermissions(id: Id, options?: QueryOptions): Promise<M | null> {
    return this.model.findById(id as any, null, options).populate({ path: 'permissions', options: { strictPopulate: false } }).exec() as Promise<M | null>;
  }  

  async findByAnyPopulatePermissions(filter: FilterQuery<M>, options?: QueryOptions): Promise<M | null> {
    return this.model.findOne( filter, null, options).populate({ path: 'permissions', options: { strictPopulate: false } }).exec() as Promise<M | null>;
  }  

  async findOne(filter: FilterQuery<M>, options?: QueryOptions): Promise<M | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  async update(update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null> {
    return this.model.updateOne(update, { new: true, ...options }).exec() as unknown as Promise<M | null>;
  }

  async updateByAny(filter: FilterQuery<M>, update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null> {
    return this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  async deleteByAny(filter: FilterQuery<M>, options?: QueryOptions): Promise<void> {
    await this.model.deleteOne(filter, options);
  }

  async deleteAll(options?: QueryOptions): Promise<void> {
    await this.model.deleteMany({}, options);
  }

  async deleteById(id: Id, options?: QueryOptions): Promise<void> {
    await this.model.findByIdAndDelete(id as any, options);
  }

  async exist(filter: FilterQuery<M>, options?: QueryOptions): Promise<boolean> {
    const count = await this.model.countDocuments(filter, options).exec();
    return count > 0;
  }
  
}

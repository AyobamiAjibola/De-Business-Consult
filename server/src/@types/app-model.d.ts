import { Document, FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

export declare namespace appModelTypes {
  interface IRestaurant {
    _id?: string;
    email: string;
    bussinessNumber: string;
    restaurantName: string;
    password: string;
    tagline: string | null;
    urlSlug: string | null;
    loginToken: string | null;
    loginDate: Date | null;
    passwordResetCode: string;
    logo: string | null;
    restaurantAddress: string;
    whatsappNumber: string;
    socialMedia: {
      instagram: string,
      facebook: string
    } | null;
    location: {
      type: "Point",
      coordinates: [number, number]
    },
    photos: string[],
    menu: IMenu[],
  }

  interface IPermission {
    id: number;
    name: string;
    action: string;
    subject: string;
    inverted: boolean;
    roles: IRole[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface IVariant {
    _id?: string,
    unit: string,
    price: string,
    variantUnitFactor?: string,
    discountPrice?: string
  }

  interface IRole {
    id: number;
    name: string;
    slug: string;
    permissions: IPermission[];
    users: IUser[];
    createdAt: Date;
    updatedAt: Date;
  }


    abstract class AbstractCrudRepository<M extends Document = Document, Id extends any = any> {
    // model?: string;

     /**
     * @name bulkCreate
     * @param records
     * @param options
     * @desc
     * Create models passed as arrays, at once..
     * This method calls the insertMany method in mongoose.
     * Pass optional config, to control the query outcome
     */
     bulkCreate(records: ReadonlyArray<M>): Promise<M[]>;

    /**
     * @name save
     * @param values
     * @param options
     * @desc
     * Save an instance of a model to the database.
     * This method calls mongoose create method.
     * Pass optional config, to control the query outcome
     */
    save(values: M, options?: QueryOptions): Promise<M>;

    /**
     * @name findAll
     * @param options
     */
    findAll(filter?: FilterQuery<M>, options?: QueryOptions, search?: string): Promise<Array<M>>;

    /**
     * @name findById
     * @param id
     * @param options
     * @desc
     * Find model instance by Id.
     * This method calls mongoose findByPk method.
     * Pass optional config, to control the query outcome
     */
    findById(id: Id, options?: QueryOptions): Promise<M | null>;

    /**
     * @name findOne
     * @param filter
     * @param options
     * 
     */
    findOne(filter: FilterQuery<M>, options?: QueryOptions): Promise<M | null>;

    /**
     * @name updateById
     * @param filter
     * @param update
     * @param options
     * @param id
     * @desc
     * Update model by id.
     * This method calls the findByIdAndUpdate method in mongoose.
     * The update param is the update object or update fields for the document.
     * Pass optional config, to control the query outcome
     */
    update(update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null>;

    /**
     * @name updateByAny
     * @param filter
     * @param update
     * @param options
     * @desc
     * Update model by any of its attributes.
     * This method calls the findOneAndUpdate method in mongoose.
     * The update param is the update object or update fields for the document.
     * Pass optional config, to control the query outcome
     */
    updateByAny(filter: FilterQuery<M>, update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null>;

    /**
     * @name deleteByAny
     * @param filter
     * @param options
     * @desc
     * Delete model data by Id..
     * This method calls the deleteOne method of the model instance in mongoose.
     * Pass optional config, to control the query outcome
     */
    deleteByAny(filter: FilterQuery<M>, options?: QueryOptions): Promise<void>;

     /**
     * @name deleteAll
     * @param options
     * @desc
     * Delete all model data.
     * This method calls the deleteMany in mongoose with option force set to true.
     * Pass optional config, to control the query outcome
     */
     deleteAll(options?: QueryOptions): Promise<void>;

    /**
     * @name deleteById
     * @param id
     * @param options
     * @desc
     * Delete model data by Id..
     * This method calls the findByIdAndDelete method in mongoose.
     * Pass optional config, to control the query outcome
     */
    deleteById(id: Id, options?: QueryOptions): Promise<void>;

    /**
     * @name exist
     * @param filter
     * @param options
     * @desc
     * Checks if an instance of a model exist in the database.
     * This method calls mongoose find one method.
     * Pass optional config, to control the query outcome
     */
    exist(filter: FilterQuery<M>, options?: QueryOptions): Promise<boolean>;

  }
  //<M extends Model = Model>
  interface ICrudDAO<M extends Document> extends Model<M> {
    
    insertMany(records: M): Promise<M[]>;

    create(values: M, options?: QueryOptions): Promise<M>;

    findAll(filter?: FilterQuery<M>, options?: QueryOptions, search?: string): Promise<M[]>;

    findById(id: any, options?: QueryOptions): Promise<M | null>;

    findByAny(filter: FilterQuery<M>, options?: QueryOptions): Promise<M | null>;

    update(update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null>;

    updateByAny(filter: FilterQuery<M>, update: UpdateQuery<M>, options?: QueryOptions): Promise<M | null>;

    deleteByAny(filter: FilterQuery<M>, options?: QueryOptions): Promise<void>;

    deleteAll(options?: QueryOptions): Promise<void>;

    deleteById(id: any, options?: QueryOptions): Promise<void>;

    exist(filter: FilterQuery<M>, options?: QueryOptions): Promise<boolean>;
    
  }
}

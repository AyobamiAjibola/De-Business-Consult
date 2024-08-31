import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import DeBizDocs, { IDeBizDocsModel } from '../models/DeBizDocs';

export default class DeBizDocsRepository extends CrudRepository<IDeBizDocsModel, Types.ObjectId> {
  constructor() {
    super(DeBizDocs as Model<IDeBizDocsModel>);
  }
}
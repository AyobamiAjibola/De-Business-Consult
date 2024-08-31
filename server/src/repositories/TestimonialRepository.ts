import CrudRepository from '../helpers/CrudRepository';
import { Model, Types } from 'mongoose';
import Testimonial, { ITestimonialModel } from '../models/Testimonial';

export default class TestimonialRepository extends CrudRepository<ITestimonialModel, Types.ObjectId> {
  constructor() {
    super(Testimonial as Model<ITestimonialModel>);
  }
}
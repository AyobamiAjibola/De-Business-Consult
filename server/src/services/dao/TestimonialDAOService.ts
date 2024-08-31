import { FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import {ITestimonialModel} from '../../models/Testimonial';

import { appModelTypes } from '../../@types/app-model';
import ICrudDAO = appModelTypes.ICrudDAO;
import TestimonialRepository from '../../repositories/TestimonialRepository';

export default class TestimonialDAOService implements ICrudDAO<ITestimonialModel> {
  private testimonialRepository: TestimonialRepository;

  constructor(testimonialRepository: TestimonialRepository) {
    this.testimonialRepository = testimonialRepository
  }

  //@ts-ignore
  insertMany(records: ReadonlyArray<ITestimonialModel>): Promise<ITestimonialModel[]> {
    return this.testimonialRepository.bulkCreate(records)
  }

  create(values: ITestimonialModel): Promise<ITestimonialModel> {
    return this.testimonialRepository.save(values);
  }

  findAll(filter?: FilterQuery<ITestimonialModel>, options?: QueryOptions): Promise<ITestimonialModel[]> {
    return this.testimonialRepository.findAll(filter, options);
  }

  findById(id: any, options?: QueryOptions): Promise<ITestimonialModel | null> {
    return this.testimonialRepository.findById(id, options);
  }

  findByAny(filter: FilterQuery<ITestimonialModel>, options?: QueryOptions): Promise<ITestimonialModel | null> {
    return this.testimonialRepository.findOne(filter, options);
  }

  update(update: UpdateQuery<ITestimonialModel>, options: QueryOptions): Promise<ITestimonialModel | null> {
    return this.testimonialRepository.update(update, { new: true, ...options });
  }

  updateByAny(
    filter: FilterQuery<ITestimonialModel>,
    update: UpdateQuery<ITestimonialModel>,
    options?: QueryOptions
  ): Promise<ITestimonialModel | null> {
    return this.testimonialRepository.updateByAny(filter, update, options)
  }

  deleteByAny(filter: FilterQuery<ITestimonialModel>, options?: QueryOptions): Promise<void> {
    return this.testimonialRepository.deleteByAny(filter, options);
  }

  deleteAll(options?: QueryOptions): Promise<void> {
    return this.testimonialRepository.deleteAll(options);
  }

  deleteById(id: any, options?: QueryOptions): Promise<void> {
    return this.testimonialRepository.deleteById(id, options);
  }

  exist(filter: FilterQuery<ITestimonialModel>, options?: QueryOptions): Promise<boolean> {
    return this.testimonialRepository.exist(filter, options);
  }

}
/**
 * This helper Class, executes commands in form of methods,we want to run at runtime.
 */

import fs from 'fs/promises';
import Generic from '../utils/Generic';
import { appModelTypes } from '../@types/app-model';
import AbstractCrudRepository = appModelTypes.AbstractCrudRepository;
import admin from '../resources/data/admin.json';
import { UPLOAD_BASE_PATH } from '../config/constants';
import { IUserModel, UserType } from '../models/User';
import UserRepository from '../repositories/UserRepository';
import datasources from '../services/dao'

export default class CommandLineRunner {
  public static singleton: CommandLineRunner = new CommandLineRunner();
  private userRepository: AbstractCrudRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public static async run() {
    await this.singleton.loadDefaultUser();
    await this.singleton.loadCalendlyuid();
  }

  async createUploadDirectory() {
    const dirExist = await Generic.fileExist(UPLOAD_BASE_PATH);
    if (!dirExist) await fs.mkdir(UPLOAD_BASE_PATH);
  }

  async loadDefaultUser() {
    const adminUser = await this.userRepository.findOne({ email: admin.email });
    
    if(!adminUser) {
      await this.userRepository.save({
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        password: admin.password,
        userType: admin.userType,
        status: true
      } as IUserModel)
    };
  }

  async loadCalendlyuid() {
    const user = await this.userRepository.findAll({ 
      userType: { $in: [UserType.SuperAdmin, UserType.Appointment] }
    });
    
    await datasources.userDAOService.updateMany(
      { userType: { $in: [UserType.SuperAdmin, UserType.Appointment] } },
      { $set: { calendly: { 
        uid: process.env.CALENDLY_USER_INFO, 
        accessToken: process.env.CALENDLY_ADMIN_ACCESS_TOKEN
      } } }
    )
  }

}

import { compare, genSalt, hash } from 'bcryptjs';

import { appCommonTypes } from '../@types/app-common';
import BcryptPasswordEncoder = appCommonTypes.BcryptPasswordEncoder;

export default class PasswordEncoder implements BcryptPasswordEncoder {
  private readonly saltRounds: number = 12;

  constructor() {
    if (process.env.BCRYPT_SALT) this.saltRounds = +process.env.BCRYPT_SALT;
  }

  async encode(rawPassword: string): Promise<string> {
    const salt = await genSalt(this.saltRounds);

    return hash(rawPassword, salt);
  }

  match(rawPassword: string, hash: string): Promise<boolean> {
    return compare(rawPassword, hash);
  }
}

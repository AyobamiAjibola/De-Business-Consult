import { MESSAGES } from '../config/constants';

export default class HttpStatus {
  public static OK = new HttpStatus(MESSAGES.http['200'], 200);
  public static ACCEPTED = new HttpStatus(MESSAGES.http['202'], 202);
  public static CREATED = new HttpStatus(MESSAGES.http['201'], 201);
  public static BAD_REQUEST = new HttpStatus(MESSAGES.http['400'], 400);
  public static NOT_FOUND = new HttpStatus(MESSAGES.http['404'], 404);
  public static UNAUTHORIZED = new HttpStatus(MESSAGES.http['401'], 401);
  public static FORBIDDEN = new HttpStatus(MESSAGES.http['403'], 403);
  public static CONFLICT = new HttpStatus(MESSAGES.http['409'], 409);
  public static INTERNAL_SERVER_ERROR = new HttpStatus(MESSAGES.http['500'], 500);
  private readonly _value: string;
  private readonly _code: number;

  constructor(value: string, code: number) {
    this._value = value;
    this._code = code;
  }

  get value(): string {
    return this._value;
  }

  get code(): number {
    return this._code;
  }
}

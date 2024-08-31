import path from "node:path";
import fs from "fs/promises";

import { v4 } from "uuid";
import moment from "moment";
import { sign, verify } from "jsonwebtoken";

import settings from "../config/settings";
import { appCommonTypes } from "../@types/app-common";
import CustomJwtPayload = appCommonTypes.CustomJwtPayload;
import crypto from  'crypto';
import CustomAPIError from '../exceptions/CustomAPIError';
import HttpStatus from '../helpers/HttpStatus';
import { NextFunction, Request } from 'express';
import UserToken from '../models/UserToken';
import * as Jimp from 'jimp';
import { ALLOWED_FILE_TYPES, ALLOWED_FILE_TYPES2, HASHTAGS, MAX_SIZE_IN_BYTE_VID, MESSAGES } from '../config/constants';
import { UserType } from "../models/User";
import datasources from '../services/dao';

interface IGetImagePath {
  basePath: string;
  filename: string;
  tempPath: string;
}

interface IRandomize {
  number?: boolean;
  alphanumeric?: boolean;
  string?: boolean;
  mixed?: boolean;
  count?: number;
}

interface IExistItems {
  item: string, //this is the item you want check for
  item2: string, //item to check against
  daoService: any, // the db entity to check from
  customErrorMsg: string // error message to be displayed
}

interface Expense {
  expenseCode: string;
}

interface IFuncIntervalCallerConfig {
  //call your functions here
  onTick: (args: this) => void | Promise<void>;
  // Number of times the function 'onTick' should run
  attempts: number;
  //Call interval. Should be in milliseconds e.g 60 * 1000
  interval: number;
  // reset the interval, until a condition is met
  reset?: boolean;
  //stop the interval
  stop?: boolean;

  //log the interval count
  log?: (args: { count: number; options: IFuncIntervalCallerConfig }) => void;
}

interface IQRCode {
  basePath: string;
  slug: string;
  type: string;
  data: string;
}

export default class Generic {
  public static functionIntervalCaller(config: IFuncIntervalCallerConfig) {
    const start = config.interval;
    const stop = config.attempts * start;
    const cycle = stop / start;
    let count = 0;

    const run = () => {
      const interval = setInterval(() => {
        if (config.reset) {
          clearInterval(interval);
          run();
        }

        count++;

        if (config.stop) clearInterval(interval);

        if (count >= cycle) clearInterval(interval);

        config.onTick(config);

        if (config.log) config.log({ count, options: config });
      }, start);
    };

    run();
  }

  public static async checkExistingEntity(items: IExistItems) {
    const parameter = items.item2;
    const dbService = items.daoService;
    if (items.item.toLowerCase() && items.item.toLowerCase() !== parameter) {
      const existingSubscriber = await dbService.findByAny({ parameter: items.item.toLowerCase() });
      if (existingSubscriber) {
        return Promise.reject(CustomAPIError.response(items.customErrorMsg, HttpStatus.CONFLICT.code));
      }
    }
  }

  public static async validatePassword(password: string) {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/;

    if (regex.test(password)) {
      return true;  // Password meets all the requirements
    } else {
      return false; // Password does not meet the requirements
    }
  }


  public static async handleAllowedUser(userType: any) {
    if(userType.includes(UserType.SuperAdmin)) {
      return true
    } else {
      return false
    }
  }

  public static async fileExist(path: string) {
    try {
      await fs.access(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static async toCamelCase(input: string): Promise<string> {
    // Split the string by spaces
    const words = input.split(' ');

    // Transform each word
    const transformedWords = words.map((word, index) => {
        if (index === 0) {
            // The first word should be in lowercase
            return word.toLowerCase();
        } else {
            // Capitalize the first letter of each subsequent word
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
    });

    // Join the words back together
    return transformedWords.join('');
  }

  public static capitalizeFirstLetter(string: string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : string;
  }

  public static capitalizeWord(sentence: string): string {
    const words = sentence?.split(" ");
    const capitalizedWords = words?.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords?.join(" ");
  }

  public static async getImagePath(params: IGetImagePath) {
    const exists = await this.fileExist(params.basePath);

    if (!exists) await fs.mkdir(params.basePath);

    const newFileName = `${v4()}${path.extname(params.filename)}`;

    const newPath = `${params.basePath}/${newFileName}`;

    await fs.rename(params.tempPath, newPath);

    return newPath;
  }

  public static async generateUUID() {
    return crypto.randomBytes(3).toString('hex');
  }


  public static async generateRandomNumberString(length: number) {
    let result = '';
    while (result.length < length) {
        const randomByte = crypto.randomBytes(1); // Get a random byte
        const randomNumber = randomByte[0] % 10;  // Get a random digit between 0-9
        result += randomNumber.toString();
    }
    return result;
  }

  public static async handleImage(image: any, basePath: string): Promise<{ result?: string, error?: string }> {
    try {
        if (!image) return { result: '' };
        const allowedFileTypes = ALLOWED_FILE_TYPES;
        if (!allowedFileTypes.includes(image.mimetype as string)) {
            throw new CustomAPIError(MESSAGES.image_type_error, HttpStatus.BAD_REQUEST.code);
        }
        const outputPath = await Generic.compressImage(image.filepath, basePath);
        const imagePath = await Generic.getImagePath({
            tempPath: outputPath,
            filename: image.originalFilename as string,
            basePath,
        });
        
        return { result: imagePath };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  public static async handleFiles(file: any, basePath: string): Promise<{ result?: string, error?: string }> {
    try {
        if (!file) return { result: '' };
        const allowedFileTypes = ALLOWED_FILE_TYPES2;
        if (!allowedFileTypes.includes(file.mimetype as string)) {
            throw new CustomAPIError(MESSAGES.file_type_error, HttpStatus.BAD_REQUEST.code);
        }

        const maxSizeInBytes = MAX_SIZE_IN_BYTE_VID;
        const actualSize = file.size / (1024 * 1024);

        if (actualSize > maxSizeInBytes) {
          return { error: MESSAGES.vid_size_error };
        }

        const imagePath = await Generic.getImagePath({
            tempPath: file.filepath,
            filename: file.originalFilename as string,
            basePath,
        });
        
        return { result: imagePath };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * @name generateJwt
   * @param payload
   * @desc
   * Generate jsonwebtoken.
   */
  public static generateJwt(payload: CustomJwtPayload) {
    const key = <string>settings.jwt.key;
    return sign(payload, key);
  }

  public static generateAccessToken(payload: CustomJwtPayload) {
    const key = <string>settings.jwtAccessToken.key;
    const expiration = <string>settings.jwtAccessToken.expiry;
    return sign(payload, key, { expiresIn: expiration });
  }

  public static extractYouTubeVideoId(url: string) {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?]+)/
    );
    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  }

  public static generateRereshToken(payload: CustomJwtPayload) {
    const key = <string>settings.jwtRefreshToken.key;
    const expiration = <string>settings.jwtRefreshToken.expiry;
    return sign(payload, key, { expiresIn: expiration });
  }

  public static camelCase(str: string) {
    const words = str.split(" ");

    // Capitalize each word and join them
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    const capitalizedStr = capitalizedWords.join("");

    // Lowercase the first letter of the result
    const transformedStr =
      capitalizedStr.charAt(0).toLowerCase() + capitalizedStr.slice(1);

    return transformedStr;
  }

  //THIS USES SHARP TO COMPRESS IMAGE
  // public static async _compressImage(imagePath: string, originalFilename: string) {
  //   let outputPath = originalFilename;
  //   try {
  //     await sharp(imagePath)
  //       .resize(700, 620)
  //       .jpeg({ quality: 80 })
  //       .toFile(outputPath);

  //     return outputPath;
  //   } catch (error) {
  //     console.error(error);
  //     throw error; // Rethrow the error to handle it upstream
  //   }
  // }

  public static async compressImage(imagePath: string, basePath?: string): Promise<string> {

    let outputPath = basePath ? path.join(basePath, "image.png") : path.join("uploads/photo", "image.png");
    
    try {
        // const image = await Jimp.read(imagePath);

        // // Resize the image
        // image.resize(700, 620);

        // // Save the compressed image
        // await image.quality(80).writeAsync(outputPath);

        return imagePath;
    } catch (error) {
        console.error(error);
        throw error; // Rethrow the error to handle it upstream
    }
  }

  public static getRandomHashtagArray() {
    const randomIndex = Math.floor(Math.random() * HASHTAGS.length);
    return HASHTAGS[randomIndex];
  }

  public static async compressMenuImage(imagePath: string): Promise<string> {
    let outputPath = path.join("uploads/photo", "image.webp");

    try {
      const image = await Jimp.read(imagePath);

      // Resize the image
      image.resize(1000, 920);

      // Save the compressed image
      await image.quality(80).writeAsync(outputPath);

      return outputPath;
    } catch (error) {
      console.error(error);
      throw error; // Rethrow the error to handle it upstream
    }
  }

  public static async convertToObject (item: string): Promise<{result?: any, error?: string}> {
    try {
      // Replace single quotes with double quotes
      item = item.replace(/'/g, '"');
    
      // Add double quotes around keys
      item = item.replace(/(\w+):/g, '"$1":');
      item = item.replace(/: ([^,}\]]+)/g, ': "$1"');
      // Remove trailing commas and enclose the objects in an array
      item = `[${item}]`;

      // Parse the JSON iteming to an object
      return { result: JSON.parse(item) };

    } catch (error: any) {
      return { error: error.message };
    }
    
  }

  public static async compressGalleryImage(imagePath: string): Promise<string> {
    let outputPath = path.join("uploads/gallery", "image.webp");

    try {
      const image = await Jimp.read(imagePath);

      // Resize the image
      image.resize(700, 620);

      // Save the compressed image
      await image.quality(80).writeAsync(outputPath);

      return outputPath;
    } catch (error) {
      console.error(error);
      throw error; // Rethrow the error to handle it upstream
    }
  }

  public static async generateJWT(payload: CustomJwtPayload) {
    try {
      // Create the access token
      const accessToken = sign(payload, <string>settings.jwtAccessToken.key, {
        expiresIn: <string>settings.jwtAccessToken.expiry,
      });

      // Create the refresh token
      const refreshToken = sign(payload, <string>settings.jwtRefreshToken.key, {
        expiresIn: <string>settings.jwtRefreshToken.expiry,
      });

      // Delete any existing user tokens
      await UserToken.deleteOne({ userId: payload.userId });

      // Calculate the refresh token expiration date (e.g., 2 days from now)
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setHours(refreshTokenExpiry.getHours() + 48);

      // Create a new user token
      await UserToken.create({
        userId: payload.userId,
        token: refreshToken,
        expired_at: refreshTokenExpiry,
      });

      return { accessToken, refreshToken };
    } catch (err: any) {
      return Promise.reject(
        CustomAPIError.response(err, HttpStatus.BAD_REQUEST.code)
      );
    }
  }

  public static async refreshToken(
    refreshToken: string,
    req: Request,
    next: NextFunction
  ) {
    try {
      if (!refreshToken) {
        return Promise.reject(
          CustomAPIError.response(
            HttpStatus.UNAUTHORIZED.value,
            HttpStatus.UNAUTHORIZED.code
          )
        );
      }

      // Check if the refresh token exists in the database
      const userToken = await UserToken.findOne({ token: refreshToken });

      if (!userToken) {
        // throw new AppError('Invalid refresh token', BAD_REQUEST);
        return Promise.reject(
          CustomAPIError.response(
            "Invalid refresh token",
            HttpStatus.BAD_REQUEST.code
          )
        );
      }

      // Verify the refresh token and get the payload
      const data: any = verify(
        refreshToken,
        settings.jwtRefreshToken.key as string
      );

      // Check if there is a valid user token in the database
      const dbToken = await UserToken.findOne({
        userId: data.userId,
        expired_at: { $gte: new Date() },
      });

      if (!dbToken) {
        // throw new AppError('Invalid refresh token', BAD_REQUEST);
        return Promise.reject(
          CustomAPIError.response(
            "Invalid refresh token",
            HttpStatus.BAD_REQUEST.code
          )
        );
      }

      // Attach the payload to the request object
      req.data = data;

      next();
    } catch (error: any) {
      next(
        Promise.reject(
          CustomAPIError.response(error, HttpStatus.BAD_REQUEST.code)
        )
      );
    }
  }

  public static generateRandomString(limit: number) {
    const letters =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz@#!$%^&+=";
    let randomString = "";
    for (let i = 0; i < limit; i++) {
      const randomNum = Math.floor(Math.random() * letters.length);
      randomString += letters.substring(randomNum, randomNum + 1);
    }

    return randomString;
  }

  public static generateRandomPassword(limit: number) {
    const letters =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz@#!$%^&=";
    let randomString = "";

    // Ensure at least one uppercase letter
    randomString += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
      Math.floor(Math.random() * 26)
    ];

    // Ensure at least one number
    randomString += "0123456789"[Math.floor(Math.random() * 10)];

    for (let i = randomString.length; i < limit; i++) {
      const randomNum = Math.floor(Math.random() * letters.length);
      randomString += letters.substring(randomNum, randomNum + 1);
    }

    return randomString;
  }

  public static generatePasswordResetCode(limit: number) {
    const letters = "0123456789";
    const letterCount = letters.length;
    const randomBytes = crypto.randomBytes(limit);
    let randomString = "";
    for (let i = 0; i < limit; i++) {
      const randomNum = randomBytes[i] % letterCount;
      randomString += letters[randomNum];
    }
    return randomString;
  }

  // THIS HAS LESS CHANCE OF DUPLICATE VALUE
  // public static generateRandomStringCrypto(limit: number) {
  //   const letters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz@#!$%^&+=';
  //   const letterCount = letters.length;
  //   const randomBytes = crypto.randomBytes(limit);
  //   let randomString = '';
  //   for (let i = 0; i < limit; i++) {
  //     const randomNum = randomBytes[i] % letterCount;
  //     randomString += letters[randomNum];
  //   }
  //   return randomString;
  // }

  /**
   * @name randomize
   * @description generate random chars (string,numbers,special characters, or mixed)
   * @description default count is 10 and result is numbers if no options are passed
   * @param options
   */
  public static randomize(options?: IRandomize) {
    const numbers = "01234567890123456789012345678901234567890123456789";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    const specialChars = "@#!$%^&+=*()<>_-?|.";

    let text = numbers;
    let count = 10;
    let result = "";

    if (options?.count) count = options.count;
    if (options?.number) text = numbers;
    if (options?.string) text = letters;
    if (options?.mixed) text = numbers + letters + specialChars;
    if (options?.alphanumeric) text = letters + numbers;

    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(Math.random() * text.length);
      result += text.substring(randomNum, randomNum + 1);
    }

    return result;
  }

  public static generateCode(data: any, prefix: string, id: number): string {
    let count = data.length + 1;
    let code: string;

    do {
      code = `${prefix}-${id}${count.toString().padStart(4, "0")}`;
      count++;
    } while (data.some((expense: any) => expense.code === code));

    return code;
  }

  // public static convertTextToCamelcase(text: string) {
  //   text = text.replace(/[^a-zA-Z0-9 ]/g, '');
  //   return camelcase(text);
  // }

  public static formatNumberToIntl(number: number) {
    return new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
    }).format(number);
  }

  public static generateSlug(text: string) {
    text = text.trim();

    if (text.search(/\s/g) !== -1) {
      return text.toUpperCase().replace(/\s/g, "_");
    }
    return text.toUpperCase();
  }

  public static calculateDiscount(principal: number, discount: number) {
    return principal - principal * (discount / 100);
  }

  public static getMonths() {
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  }

  public static location_km(
    userALat?: number,
    userALon?: number,
    userBLat?: number,
    userBLon?: number
  ) {
    const earthRadius = 6371;

    // Convert latitude and longitude to radians
    const userALatRadians = this.toRadians(userALat as number) as any;
    const userALonRadians = this.toRadians(userALon as number) as any;
    const userBLatRadians = this.toRadians(userBLat as number) as any;
    const userBLonRadians = this.toRadians(userBLon as number) as any;

    // Calculate the differences between the latitudes and longitudes
    const latDiff = userBLatRadians - userALatRadians;
    const lonDiff = userBLonRadians - userALonRadians;

    // Apply the Haversine formula
    const a =
      Math.sin(latDiff / 2) ** 2 +
      Math.cos(userALatRadians) *
        Math.cos(userBLatRadians) *
        Math.sin(lonDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate the distance
    const distance = earthRadius * c;

    return distance;
  }

  private static toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  public static dateDifference(date: any) {
    const targetDate = moment(date);
    const currentDate = moment();

    const minutesDifference = currentDate.diff(targetDate, "minutes");

    let result: any;
    if (minutesDifference < 60) {
      result = `${minutesDifference} min`;
    } else if (minutesDifference < 24 * 60) {
      const hoursDifference = Math.floor(minutesDifference / 60);
      result =
        hoursDifference === 1
          ? `${hoursDifference} hour`
          : `${hoursDifference} hours`;
    } else if (minutesDifference < 48 * 60) {
      result = "Yesterday";
    } else {
      result = targetDate.format("DD/MM/YYYY");
    }

    return result;
  }
}

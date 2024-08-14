import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import BcryptPasswordEncoder = appCommonTypes.BcryptPasswordEncoder;
import { Request } from "express";
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import settings from "../config/settings";
import SendMailService from "../services/SendMailService";
import { verify } from 'jsonwebtoken';
import UserToken from "../models/UserToken";
import { IUserModel, UserType } from "../models/User";
import Generic from "../utils/Generic";
import { ISignUpAtemptModel } from "../models/SignUpAtempt";
import signup_template from "../resources/template/email/signup";
import moment = require("moment");
import { IClientModel } from "../models/Client";

const sendMailService = new SendMailService();

interface TokenTypes {
    accessToken: string, 
    refreshToken?: string
}

export default class AuthenticationController {
    private readonly passwordEncoder: BcryptPasswordEncoder | undefined;

    constructor(passwordEncoder?: BcryptPasswordEncoder) {
      this.passwordEncoder = passwordEncoder;
    };

    @TryCatch
    public async createUser(req: Request) {
        const userId = req.user._id

        const { error, value } = Joi.object<IUserModel>({
            email: Joi.string().required().label('Email'),
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            phone: Joi.string().required().label('Phone'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.userDAOService.findByAny({ email: value.email})
        ]); 

        if(admin && !admin.userType.includes(UserType.SuperAdmin))
            return Promise.reject(CustomAPIError.response('You are not authorized.', HttpStatus.UNAUTHORIZED.code));

        if(user)
            return Promise.reject(CustomAPIError.response('A user with this email already exist.', HttpStatus.CONFLICT.code));

        const password = await this.passwordEncoder?.encode(process.env.ADMIN_PASS as string);

        const payload: Partial<IUserModel> = {
            ...value,
            userType: [UserType.Admin],
            password
        }

        await datasources.userDAOService.create(payload as IUserModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateUserStatus(req: Request) {
        const id = req.params.id
        const adminUserId = req.user._id

        const { error, value } = Joi.object<IUserModel>({
            status: Joi.string().required().label('Status')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(adminUserId),
            datasources.userDAOService.findById(id)
        ]); 

        if(admin && !admin.userType.includes(UserType.SuperAdmin))
            return Promise.reject(CustomAPIError.response('You are not authorized.', HttpStatus.UNAUTHORIZED.code));

        if(!user)
            return Promise.reject(CustomAPIError.response('User not found.', HttpStatus.NOT_FOUND.code));

        await datasources.userDAOService.updateByAny({_id: user._id}, {status: value.status});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully updated status.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchUsers(req: Request) {
        const users = await datasources.userDAOService.findAll({
            status: {
                $ne: 'super-admin'
            }
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully updated status.`,
            results: users
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async preSignUp(req: Request) {
        const { error, value } = Joi.object<ISignUpAtemptModel>({
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            phone: Joi.string().required().label('Phone'),
            email: Joi.string().required().label('Email'),
            companyName: Joi.string().required().label('Company Name'),
            additionalInformation: Joi.string().optional().allow("").label('Additional Information'),
            dob: Joi.date().optional().allow(null).label('Date of birth')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [client, signUpLink] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email }),
            datasources.signUpAtemptDAOService.findByAny({ email: value.email })
        ]); 
        if(client)
            return Promise.reject(CustomAPIError.response("A client with this email already exist.", HttpStatus.CONFLICT.code));
        if(signUpLink && signUpLink.status === 'pending' )
            return Promise.reject(CustomAPIError.response(`You have a pending registration with this email: ${value.email}. Please check your email for the sign up link.`, HttpStatus.CONFLICT.code));

        const expiredAt = moment().add(2, 'hours').valueOf();

        const payload = {
            ...value,
            expiredAt
        }

        const newData = await datasources.signUpAtemptDAOService.create( payload as unknown as ISignUpAtemptModel );
        const link = `${process.env.CLIENT_URL}/signup/${newData._id}`

        //SEND OTP TO USER EMAIL
        const mail = signup_template({
            message: `Your sign up link`,
            link
          });

        await sendMailService.sendMail({
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            // @ts-ignore
            'reply-to': process.env.SMTP_EMAIL_FROM,
            from: {
              name: 'De Business Consult',
              address: <string>process.env.SMTP_EMAIL_FROM,
            },
            subject: `De Business Consult.`,
            html: mail,
            bcc: [<string>process.env.SMTP_BCC]
        })

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `A signup link has been sent to your email.`,
            result: link
        };

        return Promise.resolve(response);
    };

    @TryCatch
    public async validateSignUpLink(req: Request) {
        const id = req.params.id;

        const [signUpLink] = await Promise.all([
            datasources.signUpAtemptDAOService.findById(id)
        ]); 

        const currentTime = moment().valueOf();

        if(!signUpLink)
            return Promise.reject(CustomAPIError.response("The sign up link is invalid.", HttpStatus.NOT_FOUND.code));

        if(signUpLink.status === 'expired')
            return Promise.reject(CustomAPIError.response("The sign up link is expired.", HttpStatus.FORBIDDEN.code));

        if(signUpLink.expiredAt < currentTime) {
            await datasources.signUpAtemptDAOService.updateByAny({_id: signUpLink._id}, {status: 'expired'})
            return Promise.reject(CustomAPIError.response("The sign up link is expired.", HttpStatus.FORBIDDEN.code));
        }

         const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully validated sign up link.`
        };

        return Promise.resolve(response); 
    }

    @TryCatch
    public async clientSignUp(req: Request) {
        const id = req.params.id;
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("Password"),
            confirmPassword: Joi.ref('password')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [signUpLink] = await Promise.all([
            datasources.signUpAtemptDAOService.findById(id)
        ]); 

        const currentTime = moment().valueOf();

        if(!signUpLink)
            return Promise.reject(CustomAPIError.response("The sign up link is invalid.", HttpStatus.NOT_FOUND.code));

        if(signUpLink.status === 'expired')
            return Promise.reject(CustomAPIError.response("The sign up link is expired.", HttpStatus.FORBIDDEN.code));

        if(signUpLink.expiredAt < currentTime) {
            await datasources.signUpAtemptDAOService.updateByAny({_id: signUpLink._id}, {status: 'expired'})
            return Promise.reject(CustomAPIError.response("The sign up link is expired.", HttpStatus.FORBIDDEN.code));
        };

        const password = await this.passwordEncoder?.encode(value.password as string);

        const payload = {
            firstName: signUpLink.firstName,
            lastName: signUpLink.lastName,
            phone: signUpLink.phone,
            email: signUpLink.email,
            password,
            dob: signUpLink.dob,
            companyName: signUpLink.companyName,
            additionalInformation: signUpLink.additionalInformation
        }

        await datasources.clientDAOService.create(payload as IClientModel);
        await datasources.signUpAtemptDAOService.deleteById(signUpLink._id);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully created an account.`
        };

        return Promise.resolve(response); 
    };

    @TryCatch
    public async getAccessToken(req: Request) {
        const { error, value } = Joi.object<any>({
            refreshToken: Joi.string().required().label('Refresh token'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        // verify the refresh token and get the payload
        const data: any = verify(value.refreshToken, settings.jwtRefreshToken.key as string);

        const dbToken = await UserToken.findOne({
            userId: data.userId,
            expired_at: { $gte: new Date() }
        });
  
        if (!dbToken) {
            return Promise.reject(CustomAPIError.response('Session has expired.', HttpStatus.BAD_REQUEST.code))
        }

        const user = await datasources.clientDAOService.findById(data.userId);
        if(!user) return Promise.reject(CustomAPIError.response("User not found.", HttpStatus.NOT_FOUND.code));

        const { accessToken }: TokenTypes = await Generic.generateJWT({
            userId: user._id
        });

        const response: HttpResponse<any> = {
            message: `Successful.`,
            code: HttpStatus.OK.code,
            result: accessToken
        };
    
        return Promise.resolve(response);

    }

    @TryCatch
    public async logging(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("Password"),
            email: Joi.string().required().label("Email")
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [client] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email })
        ]); 
        if(!client) return Promise.reject(CustomAPIError.response("Client with this email does not exist.", HttpStatus.UNAUTHORIZED.code));

        const hash = client.password as string;
        const password = value.password as string;

        const isMatch = await this.passwordEncoder?.match(password.trim(), hash ? hash.trim() : '');
        if(!isMatch) return Promise.reject(CustomAPIError.response(`${HttpStatus.UNAUTHORIZED.value}. Invalid Password.`, HttpStatus.UNAUTHORIZED.code));

        if(!client.status)
            return Promise.reject(
                CustomAPIError.response('Account is disabled. Please contact administrator', HttpStatus.UNAUTHORIZED.code)
            );
        
        const { accessToken, refreshToken }: TokenTypes = await Generic.generateJWT({
            userId: client._id,
            fullName: `${client.firstName} ${client.lastName}`
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Login successful.',
            result: {accessToken, refreshToken}
        };
    
        return Promise.resolve(response);


    };

    @TryCatch
    public async adminLogging(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("Password"),
            email: Joi.string().required().label("Email")
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user] = await Promise.all([
            datasources.userDAOService.findByAny({ email: value.email })
        ]); 
        if(!user) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.UNAUTHORIZED.code));

        const hash = user.password as string;
        const password = value.password as string;

        const isMatch = await this.passwordEncoder?.match(password.trim(), hash ? hash.trim() : '');
        if(!isMatch) return Promise.reject(CustomAPIError.response(`${HttpStatus.UNAUTHORIZED.value}. Invalid Password.`, HttpStatus.UNAUTHORIZED.code));

        if(!user.status)
            return Promise.reject(
                CustomAPIError.response('Account is disabled. Please contact administrator', HttpStatus.UNAUTHORIZED.code)
            );
        
        const { accessToken, refreshToken }: TokenTypes = await Generic.generateJWT({
            userId: user._id,
            userType: user.userType,
            fullName: `${user.firstName} ${user.lastName}`
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Login successful.',
            result: {accessToken, refreshToken}
        };
    
        return Promise.resolve(response);


    };

    @TryCatch
    public async resetPassword(req: Request) {
        const { error, value } = Joi.object<any>({
            email: Joi.string().required().label('Email')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [client] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email })
        ]); 
        if(!client) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        const otp = Generic.generateRandomPassword(10);
        const expiredAt = moment().add(30, 'minute').valueOf();
        const resetLink = `${process.env.CLIENT_URL}/resetpassword?otp=${otp}&email=${value.email}`;

        //SEND OTP TO USER EMAIL
        const mail = signup_template({
            message: `Your reset password link`,
            link: resetLink
        });

        await sendMailService.sendMail({
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            // @ts-ignore
            'reply-to': process.env.SMTP_EMAIL_FROM,
            from: {
              name: 'De Business Consult',
              address: <string>process.env.SMTP_EMAIL_FROM,
            },
            subject: `De Business Consult.`,
            html: mail,
            bcc: [<string>process.env.SMTP_BCC]
        });

        await datasources.clientDAOService.updateByAny({
            _id: client._id
        }, { passwordReset: { exp: expiredAt, code: otp } })

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `A password reset link has been sent to your email.`,
            result: resetLink
        };

        return Promise.resolve(response);

    };

    @TryCatch
    public async validateResetPasswordOtp(req: Request) {
        const { error, value } = Joi.object<any>({
            email: Joi.string().required().label('Email'),
            otp: Joi.string().required().label('Otp')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const currentDateTime = moment().valueOf();

        const [client] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email })
        ]); 
        if(!client) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        if(value.otp !== client.passwordReset.code)
            return Promise.reject(CustomAPIError.response("Otp do not match. Please try again.", HttpStatus.NOT_FOUND.code));

        if(client.passwordReset.exp < currentDateTime)
            return Promise.reject(CustomAPIError.response("Password reset link has expired.", HttpStatus.FORBIDDEN.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Password reset link in valid.`
        };

        return Promise.resolve(response);
    };

    @TryCatch
    public async changeResetPassword(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("Password"),
            confirmPassword: Joi.ref('password'),
            email: Joi.string().required().label('Email'),
            otp: Joi.string().required().label('Otp')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const currentDateTime = moment().valueOf();

        const [client] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email })
        ]); 
        if(!client) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        if(value.otp !== client.passwordReset.code)
            return Promise.reject(CustomAPIError.response("Otp do not match. Please try again.", HttpStatus.NOT_FOUND.code));

        if(client.passwordReset.exp < currentDateTime)
            return Promise.reject(CustomAPIError.response("Password reset link has expired. Please request a new link.", HttpStatus.FORBIDDEN.code));

        const password = await this.passwordEncoder?.encode(value.password as string);

        await datasources.clientDAOService.updateByAny({_id: client._id}, {
            password,
            passwordReset: {
                code: '',
                exp: 0
            }
        })

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Password reset was successful, proceed to login.`
        };

        return Promise.resolve(response);
    }

}

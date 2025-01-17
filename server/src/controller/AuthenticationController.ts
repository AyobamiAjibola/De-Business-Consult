import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import BcryptPasswordEncoder = appCommonTypes.BcryptPasswordEncoder;
import { Request, NextFunction } from "express";
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import settings from "../config/settings";
import { verify } from 'jsonwebtoken';
import UserToken from "../models/UserToken";
import { IUserModel, UserType } from "../models/User";
import Generic from "../utils/Generic";
import { ISignUpAtemptModel } from "../models/SignUpAtempt";
import signup_template from "../resources/template/email/signup";
import moment from 'moment-timezone';
import { ClientStatus, IClientModel } from "../models/Client";
import formidable, { File } from 'formidable';
import { UPLOAD_BASE_PATH } from "../config/constants";
import reg_template from "../resources/template/email/reg_template";
import rabbitMqService from "../config/RabbitMQConfig";
import RedisService from "../services/RedisService";

interface TokenTypes {
    accessToken: string, 
    refreshToken?: string
}

const form = formidable({ uploadDir: UPLOAD_BASE_PATH });
form.setMaxListeners(15);
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const redisService = new RedisService();

export default class AuthenticationController {
    private readonly passwordEncoder: BcryptPasswordEncoder | undefined;

    constructor(passwordEncoder?: BcryptPasswordEncoder) {
      this.passwordEncoder = passwordEncoder;
    };

    @TryCatch
    public async OAuth(req: Request) {

        const userId = req.user._id;

        const payload = JSON.stringify({ 
            user: userId
        });

        await redisService.saveToken('de_oauth', payload, 120);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async createUser(req: Request) {
        const userId = req.user._id

        const { error, value } = Joi.object<any>({
            email: Joi.string().required().label('Email'),
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            phone: Joi.string().required().label('Phone'),
            permission: Joi.array().required().label('Permission')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.userDAOService.findByAny({ email: value.email})
        ]); 
        
        const isAllowed = await Generic.handleAllowedUser(admin && admin.userType)
        if(admin && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(user)
            return Promise.reject(CustomAPIError.response('A user with this email already exist.', HttpStatus.CONFLICT.code));

        const password = await this.passwordEncoder?.encode(process.env.ADMIN_PASS as string);

        const payload: Partial<IUserModel> = {
            ...value,
            userType: value.permission,
            password
        }

        await datasources.userDAOService.create(payload as IUserModel);

        //SEND EMAIL USER
        const mail = signup_template({
            message: `Here is your password below. Please update it after signing in for security purposes.`,
            password: process.env.ADMIN_PASS
        });

        const emailPayload = {
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        }

        await rabbitMqService.sendEmail({data: emailPayload})

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully created a user.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async resetUserPassword(req: Request) {
        const userId = req.user._id;
        const id = req.params.id;

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.userDAOService.findById(id)
        ]); 
        
        const isAllowed = await Generic.handleAllowedUser(admin && admin.userType)
        if(admin && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!user)
            return Promise.reject(CustomAPIError.response("User not found.", HttpStatus.NOT_FOUND.code));

        const password = await this.passwordEncoder?.encode(process.env.ADMIN_PASS as string);

        await datasources.userDAOService.updateByAny({ _id: user._id }, { password });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully reset password.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateUser(req: Request) {
        const userId = req.user._id;
        const id = req.params.id

        const { error, value } = Joi.object<any>({
            email: Joi.string().label('Email'),
            firstName: Joi.string().label('First Name'),
            lastName: Joi.string().label('Last Name'),
            phone: Joi.string().label('Phone'),
            permission: Joi.array().label('Permission')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.userDAOService.findById(id)
        ]); 
        
        const isAllowed = await Generic.handleAllowedUser(admin && admin.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!user)
            return Promise.reject(CustomAPIError.response("User not found.", HttpStatus.NOT_FOUND.code));

        if (value.email && value.email !== user.email) {
            const existingUser = await datasources.userDAOService.findByAny({ email: value.email.toLowerCase() });
            if (existingUser) {
                return Promise.reject(CustomAPIError.response("A user with this email already exists.", HttpStatus.CONFLICT.code));
            }
        }

        const payload: Partial<IUserModel> = {
            email: value.email ? value.email : user.email,
            firstName: value.firstName ? value.firstName : user.firstName,
            lastName: value.lastName ? value.lastName : user.lastName,
            userType: value.permission.length ? value.permission : user.userType,
            phone: value.phone ? value.phone : user.phone
        }

        await datasources.userDAOService.updateByAny({ _id: user._id }, payload as IUserModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully updated.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateUserStatus(req: Request) {
        const id = req.params.id
        const adminUserId = req.user._id

        const [admin, user] = await Promise.all([
            datasources.userDAOService.findById(adminUserId),
            datasources.userDAOService.findById(id)
        ]); 

        if(!admin)
            return Promise.reject(CustomAPIError.response("User not found.", HttpStatus.NOT_FOUND.code));

        const isAllowed = await Generic.handleAllowedUser(admin.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!user)
            return Promise.reject(CustomAPIError.response('User not found.', HttpStatus.NOT_FOUND.code));

        await datasources.userDAOService.updateByAny({_id: user._id}, {status: !user.status});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully updated user status.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchUsers(req: Request) {
        const users = await datasources.userDAOService.findAll({
            userType: {
                $nin: ['super-admin']
            }
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            results: users
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async getSingleUser(req: Request) {
        const userId = req.params.id;
        const user = await datasources.userDAOService.findById(userId);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: user
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
        
        const [clientEmail, signUpLink, clientCompanyName] = await Promise.all([
            datasources.clientDAOService.findByAny({ email: value.email }),
            datasources.signUpAtemptDAOService.findByAny({ email: value.email }),
            datasources.clientDAOService.findByAny({ companyName: value.companyName.toLowerCase() }),
        ]); 

        let isDeleted = false;
        if(signUpLink && signUpLink.expiredAt < moment().tz(timeZone).valueOf()) {
            await datasources.signUpAtemptDAOService.deleteById(signUpLink._id)
            isDeleted = true
        }

        if(clientEmail)
            return Promise.reject(CustomAPIError.response("A client with this email already exist.", HttpStatus.CONFLICT.code));
        if(!isDeleted && signUpLink && signUpLink.status === 'pending' )
            return Promise.reject(CustomAPIError.response(`You have a pending registration with this email: ${value.email}. Please check your email for the sign up link.`, HttpStatus.CONFLICT.code));
        if(clientCompanyName)
            return Promise.reject(CustomAPIError.response(`A client with this company name: ${value.companyName} already exist.`, HttpStatus.CONFLICT.code));

        const expiredAt = moment().tz(timeZone).add(2, 'minute').valueOf();

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

        const emailPayload = {
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        }

        await rabbitMqService.sendEmail({data: emailPayload});

        const re: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `A signup link has been sent to your email.`,
            result: link
        };

        return Promise.resolve(re);
    };

    @TryCatch
    public async validateSignUpLink(req: Request) {
        const id = req.params.id;

        const [signUpLink] = await Promise.all([
            datasources.signUpAtemptDAOService.findById(id)
        ]); 

        const currentTime = moment().tz(timeZone).valueOf();

        if(!signUpLink)
            return Promise.reject(CustomAPIError.response("The sign up link is invalid.", HttpStatus.NOT_FOUND.code));

        if(signUpLink.status === 'expired')
            return Promise.reject(CustomAPIError.response("The sign up link is expired. Restart the sign up process.", HttpStatus.FORBIDDEN.code));

        if(signUpLink.expiredAt < currentTime) {
            await datasources.signUpAtemptDAOService.updateByAny({_id: signUpLink._id}, {status: 'expired'})
            return Promise.reject(CustomAPIError.response("Can not verify the sign up link. Please restart the sign up process.", HttpStatus.FORBIDDEN.code));
        }

        await datasources.signUpAtemptDAOService.updateByAny({_id: signUpLink._id}, {status: 'verified'})

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
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
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

        if(!signUpLink)
            return Promise.reject(CustomAPIError.response("The sign up link is invalid.", HttpStatus.NOT_FOUND.code));

        if(signUpLink.status === 'expired')
            return Promise.reject(CustomAPIError.response("The sign up link is expired. Restart the sign up process.", HttpStatus.FORBIDDEN.code));

        if(signUpLink.status !== 'verified') {
            return Promise.reject(CustomAPIError.response("Please verify the sign up link.", HttpStatus.FORBIDDEN.code));
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

        //SEND OTP TO USER EMAIL
        const mail = reg_template({
            header: `Welcome to De Business Consult`,
            sub: `Empowering Your Financial Success Together.`,
            body: `We build personal relationships to deliver tailored, 
                    results-driven solutions. Our expert team offers comprehensive 
                    services with a personal touch, committed to your success.`,
            footer: `Sign in today to see what we can do for you.`,
            subFooter: `${process.env.CLIENT_URL}`
        });

        const emailPayload = {
            to: signUpLink.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        }

        await rabbitMqService.sendEmail({data: emailPayload});

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

        const { accessToken, refreshToken }: TokenTypes = await Generic.verify_refresh_token(value.refreshToken);

        const response: HttpResponse<any> = {
            message: `Successful.`,
            code: HttpStatus.OK.code,
            result: { accessToken, refreshToken }
        };
    
        return Promise.resolve(response);
    }

    @TryCatch
    public async logging(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
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
        if(client.status === ClientStatus.Inactive)
            return Promise.reject(CustomAPIError.response("You are currently deactivated. Please contact support.", HttpStatus.FORBIDDEN.code))

        const hash = client.password as string;
        const password = value.password as string;

        const isMatch = await this.passwordEncoder?.match(password.trim(), hash ? hash.trim() : '');
        if(!isMatch) return Promise.reject(CustomAPIError.response(`${HttpStatus.UNAUTHORIZED.value}. Invalid Password.`, HttpStatus.UNAUTHORIZED.code));

        if(!client.status)
            return Promise.reject(
                CustomAPIError.response('Account is disabled. Please contact administrator', HttpStatus.UNAUTHORIZED.code)
            );
        
        const { accessToken, refreshToken }: TokenTypes = await Generic.generateJWT({
            userId: client._id
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Login successful.',
            result: { accessToken, refreshToken }
        };
    
        return Promise.resolve(response);


    };

    @TryCatch
    public async adminLogging(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
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
        
        const accessToken = await Generic.generateAdmJWT({
            userId: user._id,
            userType: user.userType,
            fullName: `${user.firstName} ${user.lastName}`
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Login successful.',
            result: { accessToken }
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
        if(!client) return Promise.reject(CustomAPIError.response("Client with this email does not exist.", HttpStatus.NOT_FOUND.code));

        const otp = Generic.generateRandomPassword(10);
        const expiredAt = moment().add(30, 'minute').valueOf();
        const resetLink = `${process.env.CLIENT_URL}/resetpassword?otp=${otp}&email=${value.email}`;

        //SEND OTP TO USER EMAIL
        const mail = signup_template({
            message: `Your reset password link`,
            link: resetLink
        });

        const emailPayload = {
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        };

        await rabbitMqService.sendEmail({data: emailPayload});

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
    public async resetAdminPassword(req: Request) {
        const { error, value } = Joi.object<any>({
            email: Joi.string().required().label('Email')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user] = await Promise.all([
            datasources.userDAOService.findByAny({ email: value.email })
        ]); 
        if(!user) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        const otp = Generic.generateRandomPassword(10);
        const expiredAt = moment().add(30, 'minute').valueOf();
        const resetLink = `${process.env.CLIENT_URL}/resetpassword?otp=${otp}&email=${value.email}`;

        //SEND OTP TO USER EMAIL
        const mail = signup_template({
            message: `Your reset password link`,
            link: resetLink
        });

        const emailPayload = {
            to: value.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        };
        await rabbitMqService.sendEmail({data: emailPayload});

        await datasources.userDAOService.updateByAny({
            _id: user._id
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
        if(!client) return Promise.reject(CustomAPIError.response("Client with this email does not exist.", HttpStatus.NOT_FOUND.code));

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
    public async validateResetAdminPasswordOtp(req: Request) {
        const { error, value } = Joi.object<any>({
            email: Joi.string().required().label('Email'),
            otp: Joi.string().required().label('Otp')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const currentDateTime = moment().valueOf();

        const [user] = await Promise.all([
            datasources.userDAOService.findByAny({ email: value.email })
        ]); 
        if(!user) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        if(value.otp !== user.passwordReset.code)
            return Promise.reject(CustomAPIError.response("Otp do not match. Please try again.", HttpStatus.NOT_FOUND.code));

        if(user.passwordReset.exp < currentDateTime)
            return Promise.reject(CustomAPIError.response("Password reset link has expired.", HttpStatus.FORBIDDEN.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Password reset link in valid.`
        };

        return Promise.resolve(response);
    };

    @TryCatch
    public async changePassword(req: Request) {
        const clientId = req.user._id;
        const { error, value } = Joi.object<any>({
            newPassword: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("New Password"),
            confirmNewPassword: Joi.ref('newPassword'),
            currentPassword: Joi.string().required().label("Current password")
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const client = await datasources.clientDAOService.findById(clientId);
        if(!client)
            return Promise.reject(CustomAPIError.response("Client does not found.", HttpStatus.NOT_FOUND.code));
        
        const hash = client.password as string;

        const isMatch = await this.passwordEncoder?.match(value.currentPassword.trim(), hash ? hash.trim() : '');
        if(!isMatch) return Promise.reject(CustomAPIError.response(`The current password entered does not match the old password.`, HttpStatus.UNAUTHORIZED.code));

        const password = await this.passwordEncoder?.encode(value.newPassword as string);

        await datasources.clientDAOService.updateByAny({_id: client._id}, {
            password
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `You have successfully changed your password.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async changePasswordAdmin(req: Request) {
        const userId = req.user._id;
        const { error, value } = Joi.object<any>({
            newPassword: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
                .messages({
                "string.pattern.base": `Password does not meet requirement.`,
                })
                .required()
                .label("New Password"),
            confirmNewPassword: Joi.ref('newPassword'),
            currentPassword: Joi.string().required().label("Current password")
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const user = await datasources.userDAOService.findById(userId);
        if(!user)
            return Promise.reject(CustomAPIError.response("Client does not found.", HttpStatus.NOT_FOUND.code));
        
        const hash = user.password as string;

        const isMatch = await this.passwordEncoder?.match(value.currentPassword.trim(), hash ? hash.trim() : '');
        if(!isMatch) return Promise.reject(CustomAPIError.response(`The current password entered does not match the old password.`, HttpStatus.UNAUTHORIZED.code));

        const password = await this.passwordEncoder?.encode(value.newPassword as string);

        await datasources.userDAOService.updateByAny({_id: user._id}, {
            password
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `You have successfully changed your password.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async changeResetPassword(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
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
        if(!client) return Promise.reject(CustomAPIError.response("Client with this email does not exist.", HttpStatus.NOT_FOUND.code));

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

    @TryCatch
    public async changeResetPasswordAdmin(req: Request) {
        const { error, value } = Joi.object<any>({
            password: Joi.string()
                .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,20}$/)
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

        const [user] = await Promise.all([
            datasources.userDAOService.findByAny({ email: value.email })
        ]); 
        if(!user) return Promise.reject(CustomAPIError.response("User with this email does not exist.", HttpStatus.NOT_FOUND.code));

        if(value.otp !== user.passwordReset.code)
            return Promise.reject(CustomAPIError.response("Otp do not match. Please try again.", HttpStatus.NOT_FOUND.code));

        if(user.passwordReset.exp < currentDateTime)
            return Promise.reject(CustomAPIError.response("Password reset link has expired. Please request a new link.", HttpStatus.FORBIDDEN.code));

        const password = await this.passwordEncoder?.encode(value.password as string);

        await datasources.userDAOService.updateByAny({_id: user._id}, {
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

    @TryCatch
    public async notificationSettings(req: Request) {
        const clientId = req.user._id;
        const { error, value } = Joi.object<any>({
            sms: Joi.string().optional().allow('').label('Sms notification'),
            email: Joi.string().optional().allow('').label('Email notification'),
            newUpdate: Joi.string().optional().allow('').label('News and updates notification')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const client = await datasources.clientDAOService.findById(clientId);
        if(!client)
            return Promise.reject(CustomAPIError.response("Client does not found.", HttpStatus.NOT_FOUND.code));

        await datasources.clientDAOService.update({_id: client._id}, { 
            smsNotification: value.sms === "true"
                                ? true
                                : value.sms === "false"
                                ? false
                                : client.smsNotification,
            emailNotification: value.email === "true"
                                ? true
                                : value.email === "false"
                                ? false
                                : client.emailNotification,
            newsAndUpdate: value.newUpdate === "true"
                                ? true
                                : value.newUpdate === "false"
                                ? false
                                : client.newsAndUpdate
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated notification settings.'
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateProfile (req: Request) {

        await this.doUpdateProfile(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated your profile'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async updateProfileAdmin (req: Request) {

        await this.doUpdateAdminProfile(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated your profile'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    private async doUpdateProfile(req: Request): Promise<HttpResponse<IClientModel>> {
        return new Promise((resolve, reject) => {
            form.parse(req, async (err, fields, files) => {
                const clientId = req.user._id;
                const { error, value } = Joi.object<any>({
                    firstName: Joi.string().optional().allow('').label('First Name'),
                    lastName: Joi.string().optional().allow('').label('Last Name'),
                    phone: Joi.string().optional().allow('').label('Phone'),
                    email: Joi.string().optional().allow('').label('Email'),
                    companyName: Joi.string().optional().allow('').label('Company Name'),
                    additionalInformation: Joi.string().optional().allow("").label('Additional Information'),
                    dob: Joi.date().optional().allow(null).label('Date of birth'),
                    image: Joi.any().label('Image')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                const [client] = await Promise.all([
                    datasources.clientDAOService.findById(clientId)
                ]);

                if(!client)
                    return reject(CustomAPIError.response('Client does not exist.', HttpStatus.NOT_FOUND.code));

                if (value.email && value.email !== client.email) {
                    const existingClient = await datasources.clientDAOService.findByAny({ email: value.email.toLowerCase() });
                    if (existingClient) {
                        return reject(CustomAPIError.response("A client with this email already exists.", HttpStatus.CONFLICT.code));
                    }
                }

                // if (value.phone && value.phone !== client.phone) {
                //     const existingClient = await datasources.clientDAOService.findByAny({ phone: value.phone });
                //     if (existingClient) {
                //         return reject(CustomAPIError.response("A client with this phone already exists.", HttpStatus.CONFLICT.code));
                //     }
                // }

                if (value.companyName.toLowerCase() && value.companyName.toLowerCase() !== client.companyName) {
                    const existingClient = await datasources.clientDAOService.findByAny({ companyName: value.companyName.toLowerCase() });
                    if (existingClient) {
                        return reject(CustomAPIError.response("A client with this company name already exists.", HttpStatus.CONFLICT.code));
                    }
                }

                const basePath = `${UPLOAD_BASE_PATH}/photo`;

                const { result: _image, error: imageError } = await Generic.handleImage(files.image as File, basePath);
                if (imageError) {
                    return reject(CustomAPIError.response(imageError, HttpStatus.BAD_REQUEST.code));
                }

                const payload = {
                    firstName: value.firstName ? value.firstName : client.firstName,
                    lastName: value.lastName ? value.lastName : client.lastName,
                    phone: value.phone ? value.phone : client.phone,
                    email: value.email ? value.email : client.email,
                    companyName: value.companyName ? value.companyName : client.companyName,
                    additionalInformation: value.additionalInformation ? value.additionalInformation : client.additionalInformation,
                    dob: value.dob ? value.dob : client.dob,
                    image: _image ? _image : client.image
                }

                await datasources.clientDAOService.update({_id: client._id}, payload);

                return resolve('Success' as any);
    
            })
        })
    }

    @TryCatch
    private async doUpdateAdminProfile(req: Request): Promise<HttpResponse<IClientModel>> {
        return new Promise((resolve, reject) => {
            form.parse(req, async (err, fields, files) => {
                const userId = req.user._id;
                const { error, value } = Joi.object<any>({
                    firstName: Joi.string().optional().allow('').label('First Name'),
                    lastName: Joi.string().optional().allow('').label('Last Name'),
                    phone: Joi.string().optional().allow('').label('Phone'),
                    email: Joi.string().optional().allow('').label('Email'),
                    image: Joi.any().label('Image')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                const [user] = await Promise.all([
                    datasources.userDAOService.findById(userId)
                ]);

                if(!user)
                    return reject(CustomAPIError.response('User does not exist.', HttpStatus.NOT_FOUND.code));

                if (value.email && value.email !== user.email) {
                    const existingClient = await datasources.userDAOService.findByAny({ email: value.email.toLowerCase() });
                    if (existingClient) {
                        return reject(CustomAPIError.response("A user with this email already exists.", HttpStatus.CONFLICT.code));
                    }
                }

                const basePath = `${UPLOAD_BASE_PATH}/photo`;

                const { result: _image, error: imageError } = await Generic.handleImage(files.image as File, basePath);
                if (imageError) {
                    return reject(CustomAPIError.response(imageError, HttpStatus.BAD_REQUEST.code));
                }

                const payload = {
                    firstName: value.firstName ? value.firstName : user.firstName,
                    lastName: value.lastName ? value.lastName : user.lastName,
                    phone: value.phone ? value.phone : user.phone,
                    email: value.email ? value.email : user.email,
                    image: _image ? _image : user.image
                }

                await datasources.userDAOService.update({_id: user._id}, payload);

                return resolve('Success' as any);
    
            })
        })
    }

}

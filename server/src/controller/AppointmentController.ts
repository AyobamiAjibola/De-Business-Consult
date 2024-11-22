import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import { Request } from "express";
import { AppointmentStatus, IAppointmentModel } from "../models/Appointment";
import Generic from "../utils/Generic";
import moment from "moment-timezone";
import { IAppointmentConfigModel } from "../models/AppointmentConfig";
import status_template from "../resources/template/email/status_template";
import rabbitMqService from "../config/RabbitMQConfig";

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default class AppointmentController {

    @TryCatch
    public async createAppointmentConfig (req: Request) {
        const { error, value } = Joi.object<any>({
            name: Joi.string().optional().allow('').label("Name"),
            amount: Joi.string().required().label("Amount"),
            service: Joi.string().required().label("Service id")
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );

        const service = await datasources.appointmentConfigDAOService.findByAny({ service: value.service });
        if(service)
            return Promise.reject(CustomAPIError.response("You have a service config with the selected number.", HttpStatus.BAD_REQUEST.code));

        await datasources.appointmentConfigDAOService.create({ 
            name: value.name,
            amount: value.amount,
            service: value.service
        } as IAppointmentConfigModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successful.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async getAppointmentConfig (req: Request) {
        const configs = await datasources.appointmentConfigDAOService.findAll({});

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successful.',
            results: configs
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async deleteAppointmentConfig (req: Request) {
        const serviceConfigId = req.params.serviceConfigId;

        const service = await datasources.appointmentConfigDAOService.findById(serviceConfigId);
        if(!service)
            return Promise.reject(CustomAPIError.response("Service config does not exist", HttpStatus.NOT_FOUND.code));

        await datasources.appointmentConfigDAOService.deleteById(service._id);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted.'
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async createAppointment (req: Request) {
        const { error, value } = Joi.object<any>({
            service: Joi.string().required().label("Service"),
            additionalInfo: Joi.string().optional().allow('').label('Appointment date'),
            clientId: Joi.string().optional().allow("").label('Client id'),
            email: Joi.string().optional().allow("").label("Client email"),
            firstName: Joi.string().optional().allow("").label("First name"),
            lastName: Joi.string().optional().allow("").label("Last name"),
            companyName: Joi.string().optional().allow("").label("Company name"),
            phone: Joi.string().optional().allow("").label("Phone number")
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );

        let client;
        if(value.clientId) {
            client = await datasources.clientDAOService.findById(value.clientId);
            if(!client)
                return Promise.reject(CustomAPIError.response("Client not found", HttpStatus.NOT_FOUND.code));
        }

        // const newAppointmentTime = new Date(value.time).getHours();
        // const newAppointmentDate = moment(value.date).tz(timeZone).format('DD/MM/YY');

        // const appointment = await datasources.appointmentDAOService.findByAny({
        //     email: value.email,
        //     status: AppointmentStatus.Confirmed
        // });
        
        // if (
        //     appointment &&
        //     newAppointmentTime === new Date(appointment?.time).getHours() &&
        //     moment(appointment?.date).tz(timeZone).format('DD/MM/YY') === newAppointmentDate
        // ) {
        //     return Promise.reject(
        //         CustomAPIError.response(
        //             "There's already an appointment available for you at the selected time and date.",
        //             HttpStatus.FORBIDDEN.code
        //         )
        //     );
        // };

        const appointmentConfig = await datasources.appointmentConfigDAOService.findByAny({ service: value.service })

        // const selectedDateTime = new Date(value.date);
        // const currentDateTime = new Date();

        // Reset the time of the current date to the start of the day
        // selectedDateTime.setHours(0, 0, 0, 0);
        // currentDateTime.setHours(0, 0, 0, 0);

        // // Check if the selected date is in the past
        // if (selectedDateTime < currentDateTime) {
        //     return Promise.reject(
        //         CustomAPIError.response(
        //             "You cannot select a date and time that is earlier than the current date and time.",
        //             HttpStatus.FORBIDDEN.code
        //         )
        //     );
        // }

        // if (selectedDateTime.toDateString() === currentDateTime.toDateString()) {
        //     const difference = moment(value.date).tz(timeZone).diff(moment().tz(timeZone));

        //     if (difference < 0) {
        //         return Promise.reject(
        //             CustomAPIError.response(
        //                 "You cannot select a time that is in the past.",
        //                 HttpStatus.FORBIDDEN.code
        //             )
        //         );
        //     }
        // }

        const id = await Generic.generateRandomNumberString(10);
        const payload = {
            // date: value.date,
            // time: value.time,
            service: value.service,
            appointmentId: `#${id}`,
            additionalInfo: value.additionalInfo,
            client: client ? client._id : null,
            email: value.email ? value.email : client?.email,
            firstName: value.firstName ? value.firstName : null,
            lastName: value.lastName ? value.lastName : null,
            companyName: value.companyName ? value.companyName : null,
            phone: value.phone ? value.phone : null,
            calendly_event: 'waiting'
        }

        const newAppointment = await datasources.appointmentDAOService.create(payload as IAppointmentModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully created appointment.',
            result: {appointmentId: newAppointment._id, amount: appointmentConfig ? appointmentConfig.amount : '' }
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async updateAppointment (req: Request) {
        const appointmentId = req.params.appointmentId;
        const { error, value } = Joi.object<any>({
            service: Joi.string().optional().label("Service"),
            // date: Joi.date().optional().label('Appointment date'),
            // time: Joi.date().optional().label('Appointment time'),
            additionalInfo: Joi.string().optional().allow('').label('Appointment date'),
            email: Joi.string().optional().allow("").label("Client email"),
            firstName: Joi.string().optional().allow("").label("First name"),
            lastName: Joi.string().optional().allow("").label("Last name"),
            companyName: Joi.string().optional().allow("").label("Company name"),
            phone: Joi.string().optional().allow("").label("Phone number")
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );

        const [appointment] = await Promise.all([
            datasources.appointmentDAOService.findById(appointmentId)
        ]);
        if(!appointment)
            return Promise.reject(CustomAPIError.response("Appointment not found.", HttpStatus.NOT_FOUND.code));

        // if(appointment.status !== AppointmentStatus.Pending)
        //     return Promise.reject(CustomAPIError.response("The appointment cannot be updated because it has already been confirmed.", HttpStatus.NOT_FOUND.code));

        // const selectedDate = new Date(value.date);
        // const currentDate = new Date()

        // selectedDate.setHours(0, 0, 0, 0);
        // currentDate.setHours(0, 0, 0, 0);

        // if (selectedDate < currentDate) {
        //     return Promise.reject(
        //         CustomAPIError.response(
        //             "You cannot select a date that is earlier than the current date.",
        //             HttpStatus.FORBIDDEN.code
        //         )
        //     );
        // }
        const payload = {
            // date: value.date ? value.date : appointment.date,
            // time: value.time ? value.time : appointment.time,
            service: value.service ? value.service : appointment.service,
            additionalInfo: value.additionalInfo ? value.additionalInfo : appointment.additionalInfo,
            email: value.email ? value.email : appointment.email,
            firstName: value.firstName ? value.firstName : appointment.firstName,
            lastName: value.lastName ? value.lastName : appointment.lastName,
            companyName: value.companyName ? value.companyName : appointment.companyName,
            phone: value.phone ? value.phone : appointment.phone
        }

        await datasources.appointmentDAOService.update({_id: appointment._id}, payload)
        
        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully updated appointment.'
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async changeAppointmentStatus (req: Request) {
        const appointmentId = req.params.appointmentId;
        const userId = req.user._id;
        const { error, value } = Joi.object<IAppointmentModel>({
            status: Joi.string().required().label('Status'),
            reasonForCanceling: Joi.string().optional().allow('').label('Status'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user, appointment] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.appointmentDAOService.findById(appointmentId)
        ]);

        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedAppointmentUser(user.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!appointment)
            return Promise.reject(CustomAPIError.response("Appointment does not exist.", HttpStatus.NOT_FOUND.code));

        await datasources.appointmentDAOService.updateByAny(
            { _id: appointment._id },
            { 
                status: value.status, 
                reasonForDecline: value.status === AppointmentStatus.Canceled ? value.reasonForCanceling : null
            }
        )

        //SEND OTP TO USER EMAIL
        const mail = status_template({
            item: appointment.appointmentId,
            type: 'appointment',
            status: value.status
        });

        const emailPayload = {
            to: appointment.email,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
            subject: `De Business Consult.`,
            html: mail
        }

        await rabbitMqService.sendEmail({data: emailPayload});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed status to ${value.status}.`
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async getSingleAppointment(req: Request) {
        const appointmentId = req.params.appointmentId;

        const appointment = await datasources.appointmentDAOService.findById(appointmentId);

        if(!appointment)
            return Promise.reject(CustomAPIError.response("Appointment not found", HttpStatus.NOT_FOUND.code));

        const payload = {
            //@ts-ignore
            ...appointment._doc,
            formatted_start_time: appointment.start_time ? Generic.formatTime(appointment.start_time) : null,
            formatted_end_time: appointment.end_time ? Generic.formatTime(appointment.end_time) : null,
            formatted_date: appointment.start_time ? moment(appointment.start_time).format("MMM DD, YYYY") : null,
            date_created: moment(appointment.createdAt).format("MMM DD, YYYY")
        }

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: payload,
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async deleteAppointment(req: Request) {
        const appointmentId = req.params.appointmentId;
        const userId = req.user._id;

        const appointment = await datasources.appointmentDAOService.findById(appointmentId);
        const admin_user = await datasources.userDAOService.findById(userId);

        if(!appointment)
            return Promise.reject(CustomAPIError.response("Appointment not found", HttpStatus.NOT_FOUND.code));

        if(appointment.status === AppointmentStatus.Upcoming || appointment.status === AppointmentStatus.Completed)
            return Promise.reject(
                CustomAPIError.response("Not allowed, you can only delete a cancelled appointment.", HttpStatus.UNAUTHORIZED.code)
            );

        const isAllowed = await Generic.handleAllowedUser(admin_user?.userType);
        if (!isAllowed) {
            return Promise.reject(
                CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code)
            );
        }

        await datasources.appointmentDAOService.deleteById(appointment._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successfully deleted appointment."
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchAllAppointments(req: Request) {
        const userId = req.user._id;
        const searchQuery = req.query.q;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const searchOptions = {
            search: searchQuery,
            searchFields: ["appointmentId"],
            limit: limit,
            skip: (page - 1) * limit,
        };

        const [user, appointments] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.appointmentDAOService.findAll({}, searchOptions),
        ]);

        if (!user) {
            return Promise.reject(
                CustomAPIError.response("User not found.", HttpStatus.NOT_FOUND.code)
            );
        }

        const isAllowed = await Generic.handleAllowedAppointmentUser(user.userType);
        if (!isAllowed) {
            return Promise.reject(
                CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code)
            );
        }

        if (appointments.length) {
            const now = moment().tz(timeZone).toDate();

            const [updatedCompleted, updatedUpcoming] = await Promise.all([
                datasources.appointmentDAOService.updateMany(
                    { end_time: { $lt: now }, status: { $nin: [ AppointmentStatus.Completed, AppointmentStatus.Canceled, AppointmentStatus.No_Show ] } },
                    { $set: { status: AppointmentStatus.Completed } }
                ),
                datasources.appointmentDAOService.updateMany(
                    { end_time: { $gt: now }, status: { $nin: [AppointmentStatus.Upcoming, AppointmentStatus.Canceled, AppointmentStatus.No_Show] } },
                    { $set: { status: AppointmentStatus.Upcoming } }
                ),
            ]);

            // Fetch the updated appointments to ensure the latest data is returned
            const updatedAppointments = await datasources.appointmentDAOService.findAll(
                {},
                searchOptions
            );

            const filtered = updatedAppointments.map((appointment) => ({
                //@ts-ignore
                ...appointment._doc,
                formatted_start_time: appointment.start_time ? Generic.formatTime(appointment.start_time) : null,
                formatted_end_time: appointment.end_time ? Generic.formatTime(appointment.end_time) : null,
                formatted_date: appointment.start_time ? moment(appointment.start_time).format("MMM DD, YYYY") : null,
                date_created: moment(appointment.createdAt).format("MMM DD, YYYY")
            }));

            const response: HttpResponse<any> = {
                code: HttpStatus.OK.code,
                message: "Successful.",
                results: filtered,
            };

            return Promise.resolve(response);
        }

        return Promise.resolve({
            code: HttpStatus.OK.code,
            message: "No appointments found.",
            results: [],
        });
    }

    @TryCatch
    public async fetchClientAppointments (req: Request) {
        const clientId = req.params.clientId;
        const searchQuery = req.query.q;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const searchOptions = {
            search: searchQuery,
            searchFields: ["appointmentId"],
            limit: limit,
            skip: (page - 1) * limit
        };

        const client = await datasources.clientDAOService.findById(clientId);
        if(!client) 
            return Promise.reject(CustomAPIError.response("Client does not exist", HttpStatus.NOT_FOUND.code));

        const appointments = await datasources.appointmentDAOService.findAll({ client: client._id }, searchOptions);

        if (appointments.length) {
            const now = moment().toDate();

            // Perform updates directly in the database to avoid redundant filtering
            const [updatedCompleted, updatedUpcoming] = await Promise.all([
                datasources.appointmentDAOService.updateMany(
                    { end_time: { $lt: now }, status: { $nin: [ AppointmentStatus.Completed, AppointmentStatus.Canceled, AppointmentStatus.No_Show ] } },
                    { $set: { status: AppointmentStatus.Completed } }
                ),
                datasources.appointmentDAOService.updateMany(
                    { end_time: { $gt: now }, status: { $nin: [AppointmentStatus.Upcoming, AppointmentStatus.Canceled, AppointmentStatus.No_Show ] } },
                    { $set: { status: AppointmentStatus.Upcoming } }
                ),
            ]);

            // Fetch the updated appointments to ensure the latest data is returned
            const updatedAppointments = await datasources.appointmentDAOService.findAll(
                {},
                searchOptions
            );

            const filtered = updatedAppointments.map((appointment) => ({
                //@ts-ignore
                ...appointment._doc,
                formatted_start_time: appointment.start_time ? Generic.formatTime(appointment.start_time) : null,
                formatted_end_time: appointment.end_time ? Generic.formatTime(appointment.end_time) : null,
                formatted_date: appointment.start_time ? moment(appointment.start_time).format("MMM DD, YYYY") : null,
                date_created: moment(appointment.createdAt).format("MMM DD, YYYY")
            }));

            const response: HttpResponse<any> = {
                code: HttpStatus.OK.code,
                message: "Successful.",
                results: filtered,
            };

            return Promise.resolve(response);
        }

        return Promise.resolve({
            code: HttpStatus.OK.code,
            message: "No appointments found.",
            results: [],
        });
    }

}
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
import moment from "moment";

export default class AppointmentController {

    @TryCatch
    public async createAppointment (req: Request) {
        const { error, value } = Joi.object<any>({
            services: Joi.array()
                .items(Joi.string()).required().label("Services"),
            date: Joi.date().required().label('Appointment date'),
            time: Joi.date().required().label('Appointment time'),
            additionalInfo: Joi.string().optional().allow('').label('Appointment date'),
            clientId: Joi.string().optional().allow("").label('Client id'),
            email: Joi.string().optional().allow("").label("Client email"),
            firstName: Joi.string().optional().allow("").label("First name"),
            lastName: Joi.string().optional().allow("").label("Last name"),
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
        let appointment;
        if(value.clientId) {
            client = await datasources.clientDAOService.findById(value.clientId);
            if(!client)
                return Promise.reject(CustomAPIError.response("Client not found", HttpStatus.NOT_FOUND.code));

            appointment = await datasources.appointmentDAOService.findByAny({
                client: value.client ? client?._id : null,
                status: AppointmentStatus.Confirmed
            });
        } else {
            appointment = await datasources.appointmentDAOService.findByAny({
                email: value.email,
                status: AppointmentStatus.Confirmed
            });
        }

        const newAppointmentTime = new Date(value.time).getHours();
        const newAppointmentDate = moment(value.date).format('DD/MM/YY')
        
        if (
            appointment &&
            newAppointmentTime === new Date(appointment?.time).getHours() &&
            moment(appointment?.date).format('DD/MM/YY') === newAppointmentDate
        ) {
            return Promise.reject(
                CustomAPIError.response(
                    "There's already an appointment available for you at the selected time and date.",
                    HttpStatus.FORBIDDEN.code
                )
            );
        }

        const selectedDate = new Date(value.date);
        const currentDate = new Date();

        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate < currentDate) {
            return Promise.reject(
                CustomAPIError.response(
                    "You cannot select a date that is earlier than the current date.",
                    HttpStatus.FORBIDDEN.code
                )
            );
        }

        const id = await Generic.generateRandomNumberString(10);
        const payload = {
            status: AppointmentStatus.Pending,
            date: value.date,
            time: value.time,
            services: value.services,
            appointmentId: `#${id}`,
            additionalInfo: value.additionalInfo,
            client: client ? client._id : null,
            email: value.email ? value.email : null,
            firstName: value.firstName ? value.firstName : null,
            lastName: value.lastName ? value.lastName : null,
            phone: value.phone ? value.phone : null
        }

        const newAppointment = await datasources.appointmentDAOService.create(payload as IAppointmentModel)
        
        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully created appointment.',
            result: newAppointment._id
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async updateAppointment (req: Request) {
        const appointmentId = req.params.appointmentId;
        const { error, value } = Joi.object<any>({
            services: Joi.array()
                .items(Joi.string()).optional().label("Services"),
            date: Joi.date().optional().label('Appointment date'),
            time: Joi.date().optional().label('Appointment time'),
            additionalInfo: Joi.string().optional().allow('').label('Appointment date'),
            email: Joi.string().optional().allow("").label("Client email"),
            firstName: Joi.string().optional().allow("").label("First name"),
            lastName: Joi.string().optional().allow("").label("Last name"),
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

        if(appointment.status !== AppointmentStatus.Pending)
            return Promise.reject(CustomAPIError.response("The appointment cannot be updated because it has already been confirmed.", HttpStatus.NOT_FOUND.code));

        const selectedDate = new Date(value.date);
        const currentDate = new Date()

        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate < currentDate) {
            return Promise.reject(
                CustomAPIError.response(
                    "You cannot select a date that is earlier than the current date.",
                    HttpStatus.FORBIDDEN.code
                )
            );
        }
        const payload = {
            date: value.date ? value.date : appointment.date,
            time: value.time ? value.time : appointment.time,
            services: value.services ? value.services : appointment.services,
            additionalInfo: value.additionalInfo ? value.additionalInfo : appointment.additionalInfo,
            email: value.email ? value.email : appointment.email,
            firstName: value.firstName ? value.firstName : appointment.firstName,
            lastName: value.lastName ? value.lastName : appointment.lastName,
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

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
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

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed status to ${value.status}.`
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchAllAppointments (req: Request) {
        const userId = req.user._id;
        const searchQuery = req.query.q;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const searchOptions = {
            search: searchQuery,
            searchFields: ["appointmentId"],
            limit: limit,
            skip: (page - 1) * limit
        };

        const [user, appointments] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.appointmentDAOService.findAll({}, searchOptions)
        ]);

        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        // const pending = await Appointment.count({
        //     status: AppointmentStatus.Pending
        // });
        // const confirmed = await Appointment.count({
        //     status: AppointmentStatus.Confirmed
        // });
        // const completed = await Appointment.count({
        //     status: AppointmentStatus.Completed
        // });
        // const canceled = await Appointment.count({
        //     status: AppointmentStatus.Canceled
        // });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: appointments
          };
      
        return Promise.resolve(response);
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

        // const pending = await Appointment.count({
        //     status: AppointmentStatus.Pending,
        //     client: client._id
        // });
        // const confirmed = await Appointment.count({
        //     status: AppointmentStatus.Confirmed,
        //     client: client._id
        // });
        // const completed = await Appointment.count({
        //     status: AppointmentStatus.Completed,
        //     client: client._id
        // });
        // const canceled = await Appointment.count({
        //     status: AppointmentStatus.Canceled,
        //     client: client._id
        // });


        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: appointments
          };
      
        return Promise.resolve(response);
    }

}
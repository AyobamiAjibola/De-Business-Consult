import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import { Request } from "express";
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import { IServicesModel } from "../models/Services";
import Generic from "../utils/Generic";
import Client, { ClientStatus, IClientModel } from "../models/Client";
import Application, { ApplicationStatus } from "../models/Application";
import Appointment, { AppointmentStatus } from "../models/Appointment";

export default class AdminController {

    @TryCatch
    public async createService(req: Request) {

        const { error, value } = Joi.object<IServicesModel>({
            name: Joi.string().required().label('Service name'),
            cost: Joi.string().required().label('Cost'),
            description: Joi.string().required().label('Description'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [service] = await Promise.all([
            datasources.servicesDAOService.findByAny({ name: value.name.toLowerCase() })
        ]);

        if(service)
            return Promise.reject(CustomAPIError.response('Service name already exist.', HttpStatus.NOT_FOUND.code));

        const payload = {
            ...value,
            name: value.name.toLowerCase()
        }

        await datasources.servicesDAOService.create(payload as IServicesModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: `Successfully created.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateService(req: Request) {
        const serviceId = req.params.serviceId;

        const { error, value } = Joi.object<IServicesModel>({
            name: Joi.string().label('Service name'),
            cost: Joi.string().label('Cost'),
            description: Joi.string().label('Description'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [service] = await Promise.all([
            datasources.servicesDAOService.findById(serviceId)
        ]);
        
        if(!service)
            return Promise.reject(CustomAPIError.response('Service does not exist.', HttpStatus.NOT_FOUND.code));

        if (value.name.toLowerCase() && value.name.toLowerCase() !== service.name) {
            const existingService = await datasources.servicesDAOService.findByAny({ name: value.name.toLowerCase() });
            if (existingService) {
                return Promise.reject(CustomAPIError.response("A service with this name already exists.", HttpStatus.CONFLICT.code));
            }
        }

        const payload = {
            name: value.name ? value.name.toLowerCase() : service.name,
            cost: value.cost ? value.cost : service.cost,
            description: value.description ? value.description : service.description
        }

        await datasources.servicesDAOService.updateByAny({_id: service._id}, payload as IServicesModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully updated.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchServices(req: Request) {
        const services: any = await datasources.servicesDAOService.findAll({});

        const response: HttpResponse<IServicesModel> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            results: services
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async getSingleService(req: Request) {
        const serviceId = req.params.serviceId;

        const service = await datasources.servicesDAOService.findById(serviceId);
        if(!service)
            return Promise.reject(CustomAPIError.response("Service not found.", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: service
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async deleteService(req: Request) {
        const serviceId = req.params.serviceId;

        const service = await datasources.servicesDAOService.findById(serviceId);
        if(!service)
            return Promise.reject(CustomAPIError.response("Service not found.", HttpStatus.NOT_FOUND.code));

        await datasources.servicesDAOService.deleteByAny({_id: service._id});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully deleted service.`
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async dashboardData(req: Request) {
        const userId = req.user._id;
        const searchQuery = req.query.q;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const searchOptions = {
            search: searchQuery,
            searchFields: ["applicationId"],
            limit: limit,
            skip: (page - 1) * limit
        };

        const [user, applications, appointments, clientsCount, applicationCount, appointmentCount] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.applicationDAOService.findAll({ 
                status: ApplicationStatus.InReview
            }, searchOptions),
            datasources.appointmentDAOService.findAll({
                status: { $in: [AppointmentStatus.Pending, AppointmentStatus.Confirmed] }
            }, searchOptions),
            Client.count(),
            Application.count(),
            Appointment.count()
        ]);
        
        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: {
                applications, 
                appointments, 
                clientsCount, 
                applicationCount, 
                appointmentCount
            }
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async createClient(req: Request) {
        const userId = req.user._id;

        const { error, value } = Joi.object<any>({
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            phone: Joi.string().required().label('Phone'),
            email: Joi.string().required().label('Email'),
            companyName: Joi.string().required().label('Company Name'),
            additionalInformation: Joi.string().required().allow("").label('Additional Information'),
            dob: Joi.date().optional().allow(null).label('Date of birth')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user, clientEmail, clientCompanyName] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.clientDAOService.findByAny({
                email: value.email
            }),
            datasources.clientDAOService.findByAny({
                companyName: value.companyName.toLowerCase()
            })
        ]);

        const isAllowed = Generic.handleAllowedUser
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(clientEmail)
            return Promise.reject(CustomAPIError.response(`Client with this email: ${value.email} already exists.`, HttpStatus.NOT_FOUND.code));
        if(clientCompanyName)
            return Promise.reject(CustomAPIError.response(`Client with this company name: ${value.companyName} already exists.`, HttpStatus.NOT_FOUND.code));

        const payload = {
            ...value,
            companyName: value.companyName.toLowerCase()
        }

        await datasources.clientDAOService.create(payload as IClientModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully created a client.`
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async toggleClientStatus(req: Request) {
        const userId = req.user._id;
        const clientId = req.params.clientId;

        const [user, client] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.clientDAOService.findById(clientId)
        ]);

        const isAllowed = Generic.handleAllowedUser
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!client)
            return Promise.reject(CustomAPIError.response(`Client does not exist.`, HttpStatus.NOT_FOUND.code));

        const updated = await datasources.clientDAOService.updateByAny({ _id: client._id }, {
            status: client.status === ClientStatus.Active
                        ? ClientStatus.Inactive
                        : ClientStatus.Active
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed client status to ${updated?.status}..`
        };

        return Promise.resolve(response);
    }
}
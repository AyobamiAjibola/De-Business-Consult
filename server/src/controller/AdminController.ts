import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import { Request } from "express";
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import { IServicesModel } from "../models/Services";

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
            return Promise.reject(CustomAPIError.response('Service name already exist.', HttpStatus.NOT_FOUND.code));

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
}
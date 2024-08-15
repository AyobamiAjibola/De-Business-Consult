import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import { UPLOAD_BASE_PATH } from "../config/constants";
import formidable = require("formidable");
import Application, { ApplicationStatus, IApplicationModel } from "../models/Application";
import { promisify } from "util";
import Generic from "../utils/Generic";
import archiver from 'archiver';
import fs from 'fs';
import { Request, Response } from "express";

const form = formidable({ uploadDir: UPLOAD_BASE_PATH });
form.setMaxListeners(15);

export default class ApplicationController {

    @TryCatch
    public async feeCalculatorV1 (req: Request) {
        const { error, value } = Joi.object<any>({
            services: Joi.array()
                .items(Joi.string()).required().label("Services"),
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );
        
        let totalCost = 0;
        const services = await Promise.all(
            value.services.map((item: any) => datasources.servicesDAOService.findById(item))
        );
        
        for (const service of services) {
            if (service) {
                totalCost += service.cost;
            }
        }

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: totalCost
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchClientApplications (req: Request) {
        const clientId = req.params.clientId;
        const applications = await datasources.applicationDAOService.findAll({ client: clientId });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: applications
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchAllApplications (req: Request) {
        const applications = await datasources.applicationDAOService.findAll();
        
        const submitted = await Application.count({
            status: ApplicationStatus.Submitted
        });
        const inReview = await Application.count({
            status: ApplicationStatus.InReview
        });
        const declined = await Application.count({
            status: ApplicationStatus.Declined
        });
        const successful = await Application.count({
            status: ApplicationStatus.Successful
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: {
                applications,
                submitted,
                declined,
                successful,
                inReview
            }
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async changeApplicationsStatus (req: Request) {
        const applicationId = req.params.applicationId;
        const { error, value } = Joi.object<IApplicationModel>({
            status: Joi.string().required().label('Status'),
            reasonForDecline: Joi.string().optional().allow('').label('Status'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const application = await datasources.applicationDAOService.findById(applicationId);
        if(!application)
            return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code));

        await datasources.applicationDAOService.updateByAny(
            { _id: application._id },
            { 
                status: value.status, 
                reasonForDecline: value.status === ApplicationStatus.Declined ? value.reasonForDecline : null
            }
        )

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed status to ${value.status}.`
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async downloadApplicationDocs (req: Request, res: Response) {
        const applicationId = req.params.applicationId;

        const application = await datasources.applicationDAOService.findById(applicationId);
        if(!application)
            return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code));

        if(application.status !== ApplicationStatus.Successful)
            return Promise.reject(CustomAPIError.response("Application is not successful.", HttpStatus.FORBIDDEN.code));

        // Initialize the zip archive
        const archive = archiver('zip', { zlib: { level: 9 } }); // High compression
        const zipFilename = `application_${applicationId}_docs.zip`;

        // Set the headers for zip file download
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
        res.setHeader('Content-Type', 'application/zip');

        // Pipe the archive data to the response
        archive.pipe(res);
        
        if(application.successful.length > 0) {
            for (const filePath of application.successful) {
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: '' });
                } else {
                    Promise.reject(CustomAPIError.response(`File not found: ${filePath}`, HttpStatus.NOT_FOUND.code));
                    continue;
                }
            }
        }

        // Finalize the archive (this sends the response)
        await archive.finalize();

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully downloaded.`
          };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async createApplication (req: Request) {
        await this.doCreateApplication(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successful.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async uploadSuccessfulDocs (req: Request) {
        await this.doUploadSuccessDocs(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successful.'
        };
      
        return Promise.resolve(response);
    };

    private async doCreateApplication(req: Request): Promise<HttpResponse<IApplicationModel>> {
        return new Promise((resolve, reject) => {

            form.parse(req, async (err, fields, files) => {
                const loggedInClient = req.user._id;

                const { error, value } = Joi.object<IApplicationModel>({
                    services: Joi.array()
                        .items(
                            Joi.object({
                                service: Joi.string().required().label('Service id'),
                                docs: Joi.array().items(Joi.any().label('Documents')).required().label('Documents'),
                                additionalInformation: Joi.string().optional().allow('').label('Additional Information')
                            })
                        ).label('Services'),
                    paymentType: Joi.string().label('Payment Type')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                const [client] = await Promise.all([
                    datasources.clientDAOService.findById(loggedInClient)
                ]);

                if(!client)
                    return reject(CustomAPIError.response("Not found", HttpStatus.NOT_FOUND.code));

                let serviceFee = 0;
                let docsLength = 0;
                const services = await Promise.all(value.services.map(async (serviceData, index) => {
                    const serviceFiles = files[`services[${index}][docs]`] as unknown as formidable.Files;

                    const processedFiles = [];
                    for (const key of Object.keys(serviceFiles)) {
                        const serviceFile = serviceFiles[key] as formidable.File;

                        const applicationFiles = `${UPLOAD_BASE_PATH}/applications`;

                        const [{ result, error }] = await Promise.all([
                            Generic.handleFiles(serviceFile as unknown as File, applicationFiles)
                        ]);

                        if (error) {
                            return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                        }
                    
                        processedFiles.push(result);
                    }

                    const service = await datasources.servicesDAOService.findById(serviceData.service);
                    if(!service)
                        return reject(CustomAPIError.response("Service does not exist.", HttpStatus.NOT_FOUND.code))

                    serviceFee += service.cost;
                    docsLength += processedFiles.length;
        
                    // Return the complete service object including the processed file paths
                    return {
                        service: service._id,
                        files: processedFiles,
                        additionalInformation: serviceData.additionalInformation || '',
                    };
                }));

                const payload: any = {
                    services,
                    paymentType: value.paymentType,
                    client: client._id,
                    fee: serviceFee.toString(),
                    status: ApplicationStatus.Submitted,
                    applicationId: `#${Generic.generateRandomNumberString(10)}`,
                    documentAttached: docsLength
                };

                const application: any = await datasources.applicationDAOService.create(payload as IApplicationModel);

                return resolve(application)

            })
        })
    };

    private async doUploadSuccessDocs(
        req: Request
      ): Promise<HttpResponse<IApplicationModel>> {
        return new Promise((resolve, reject) => {
          form.parse(req, async (err, fields, files) => {
            const applicationId = req.params.applicationId;
    
            const { error, value } = Joi.object<any>({
              applicationFiles: Joi.array().items(Joi.any()).label("Files"),
            }).validate(fields);
    
            if (error) {
              return reject(
                CustomAPIError.response(
                  error.details[0].message,
                  HttpStatus.BAD_REQUEST.code
                )
              );
            }
    
            const [application] = await Promise.all([
                datasources.applicationDAOService.findById(applicationId)
            ]);

            if(!application)
                return reject(CustomAPIError.response("Client does not exist.", HttpStatus.NOT_FOUND.code));

            let successApplicationFiles = [];
            for (const key of Object.keys(files)) {
                const serviceFile = files[key] as formidable.File;

                const applicationFiles = `${UPLOAD_BASE_PATH}/successful-applications`;

                const [{ result, error }] = await Promise.all([
                    Generic.handleFiles(serviceFile as unknown as File, applicationFiles)
                ]);

                if (error) {
                    return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                }
    
              successApplicationFiles.push(result);
            }

            await datasources.applicationDAOService.updateByAny(
                { _id: application._id },
                { successful: successApplicationFiles, status: ApplicationStatus.Successful }
            )
    
            //@ts-ignore
            return resolve(result);
          });
        });
    }
}
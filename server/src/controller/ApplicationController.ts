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
import Generic from "../utils/Generic";
import { Request, Response } from "express";
import StripeWebhookService from "../services/StripeWebhookService";
import settings from "../config/settings";
import stripe from "../utils/StripeConfig";

const webhookService = new StripeWebhookService(settings.stripe.web_hook_secret);
const form = formidable({ uploadDir: UPLOAD_BASE_PATH });
form.setMaxListeners(15);

export default class ApplicationController {

    public async paymentCheckout(req: Request) {
        const { amount } = req.body; // Amount in dollars or currency specified
        
        try {
          // Create a Checkout Session
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: 'Product Name', // Replace with dynamic product name if necessary
                  },
                  unit_amount: amount * 100, // Amount in cents (50 USD becomes 5000 cents)
                },
                quantity: 1,
              },
            ],
            metadata: {
                userId: "req.user._id"
            },
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
          });
      
          const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Checkout Session created successfully',
            result: { sessionId: session.id }
          };
      
          return Promise.resolve(response);
      
        } catch (error: any) {
          console.error('Error creating Checkout Session:', error);
      
          const response: HttpResponse<any> = {
            code: HttpStatus.BAD_REQUEST.code,
            message: 'Failed to create Checkout Session',
          };
      
          return Promise.resolve(response);
        }
      }

    public async paymentIntent(req: Request) {

        const { error, value } = Joi.object<any>({
            amount: Joi.number().required().label("Service Amount"),
            application: Joi.string().required().label("Application Id")
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );

        const application = await datasources.applicationDAOService.findById(value.application);
        if(!application)
            return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code))
        
        const transaction = await datasources.transactionDAOService.findByAny({ application: value.application });
        if(transaction && transaction.paid)
            return Promise.reject(CustomAPIError.response("The application has already been paid for.", HttpStatus.BAD_REQUEST.code))
        
        try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: value.amount * 100,
              currency: 'usd',
              metadata: {
                applicationId: value.application
              }
            });

            const response: HttpResponse<any> = {
                code: HttpStatus.OK.code,
                message: 'Success',
                result: { 
                    clientSecret: paymentIntent.client_secret,
                    paymentIntentId: paymentIntent.id
                }
            };
          
            return Promise.resolve(response);
        } catch (error: any) {
            console.error('Error creating PaymentIntent:', error);
            const response: HttpResponse<any> = {
                code: HttpStatus.BAD_REQUEST.code,
                message: 'Failed to create PaymentIntent'
            };
          
            return Promise.resolve(response);
        }

    }

    public async webhook(req: Request) {
        let message = ''
        try {
            const event = await webhookService.verifyEvent(req);
            const result = await webhookService.handleEvent(event);
        
            if (result.status === 'success') {
                message = 'success'
            } else {
                console.log(result.message, 'error message')
                message = 'error message'
            }
          } catch (error: any) {
            console.log(`Webhook Error: ${error.message}`)
            message = 'Webhook Error'
        }

        const response: HttpResponse<any> = {
            code: message === 'success' ? HttpStatus.OK.code : HttpStatus.BAD_REQUEST.code,
            message,
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchTransactions (req: Request) {
        const userId = req.user._id;

        const [user, transactions] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.transactionDAOService.findAll({})
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful",
            results: transactions
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async getSingleTransaction (req: Request) {
        const transactionId = req.params.transactionId;

        const [transaction] = await Promise.all([
            datasources.transactionDAOService.findById(transactionId)
        ]);

        if(!transaction)
            return Promise.reject(CustomAPIError.response("Transaction does not exist.", HttpStatus.NOT_FOUND.code))

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful",
            result: transaction
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async deleteTransaction (req: Request) {
        const transactionId = req.params.transactionId;

        const [transaction] = await Promise.all([
            datasources.transactionDAOService.findById(transactionId)
        ]);

        if(!transaction)
            return Promise.reject(CustomAPIError.response("Transaction does not exist.", HttpStatus.NOT_FOUND.code))

        await datasources.transactionDAOService.deleteById(transaction._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successfully deleted."
        };
      
        return Promise.resolve(response);
    }

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

        const applications = await datasources.applicationDAOService.findAll({ client: clientId }, searchOptions);

        const submitted = await Application.count({
            status: ApplicationStatus.Submitted,
            client: client._id
        });
        const inReview = await Application.count({
            status: ApplicationStatus.InReview,
            client: client._id
        });
        const declined = await Application.count({
            status: ApplicationStatus.Declined,
            client: client._id
        });
        const successful = await Application.count({
            status: ApplicationStatus.Successful,
            client: client._id
        });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: {
                applications,
                submitted,
                inReview,
                declined,
                successful
            }
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchAllApplications (req: Request) {
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

        const [user, applications] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.applicationDAOService.findAll({}, searchOptions)
        ]);

        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        // const submitted = await Application.count({
        //     status: ApplicationStatus.Submitted
        // });
        // const inReview = await Application.count({
        //     status: ApplicationStatus.InReview
        // });
        // const declined = await Application.count({
        //     status: ApplicationStatus.Declined
        // });
        // const successful = await Application.count({
        //     status: ApplicationStatus.Successful
        // });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            result: applications,
          };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async changeApplicationsStatus (req: Request) {
        const applicationId = req.params.applicationId;
        const userId = req.user._id;
        const { error, value } = Joi.object<IApplicationModel>({
            status: Joi.string().required().label('Status'),
            reasonForDecline: Joi.string().optional().allow('').label('Status'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user, application] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.applicationDAOService.findById(applicationId)
        ]);

        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

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

        // const application = await datasources.applicationDAOService.findById(applicationId);
        // if(!application)
        //     return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code));

        // if(application.status !== ApplicationStatus.Successful)
        //     return Promise.reject(CustomAPIError.response("Application is not successful.", HttpStatus.FORBIDDEN.code));

        // res.setHeader('Content-Disposition', 'attachment; filename=test.zip');
        // res.setHeader('Content-Type', 'application/zip');

        // // res.setHeader('Content-Disposition', 'attachment; filename=test.txt');
        // // res.setHeader('Content-Type', 'text/plain');
        // // res.send('Hello World!');

        // const archive = archiver('zip', { zlib: { level: 9 } });

        // archive.on('error', (err) => {
        //     console.error("Archive Error:", err);
        //     res.status(500).send({ error: err.message });
        // });

        // archive.pipe(res);
        // archive.append('Hello World!', { name: 'hello.txt' });

        // await archive.finalize();

        res.setHeader('Content-Disposition', 'attachment; filename=test.txt');
        res.setHeader('Content-Type', 'text/plain');

        console.log('Setting headers:', res.getHeaders());

        // res.send('Hello World!');

        // // Initialize the zip archive
        // const archive = archiver('zip', { zlib: { level: 9 } }); // High compression
        // const zipFilename = `application_${applicationId}_docs.zip`;

        // // Set the headers for zip file download
        // res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
        // res.setHeader('Content-Type', 'application/zip');

        // // Pipe the archive data to the response
        // archive.pipe(res);
        
        // if(application.successful.length > 0) {
        //     for (const filePath of application.successful) {
        //         if (fs.existsSync(filePath)) {
        //             archive.file(filePath, { name: '' });
        //         } else {
        //             Promise.reject(CustomAPIError.response(`File not found: ${filePath}`, HttpStatus.NOT_FOUND.code));
        //             continue;
        //         }
        //     }
        // }

        // // Finalize the archive (this sends the response)
        // await archive.finalize();

    }
    // @TryCatch
    // public async downloadApplicationDocs(req: Request, res: Response) {
    //     const applicationId = req.params.applicationId;

    //     const application = await datasources.applicationDAOService.findById(applicationId);
    //     if (!application) {
    //         throw CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code);
    //     }

    //     if (application.status !== ApplicationStatus.Successful) {
    //         throw CustomAPIError.response("Application is not successful.", HttpStatus.FORBIDDEN.code);
    //     }

    //     for (const filePath of application.successful) {
    //         if (!fs.existsSync(filePath)) {
    //             throw CustomAPIError.response(`File not found: ${filePath}`, HttpStatus.NOT_FOUND.code);
    //         }
    //     }

    //     const archive = archiver('zip', { zlib: { level: 9 } });
    //     const zipFilename = `application_${applicationId}_docs.zip`;

    //     res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
    //     res.setHeader('Content-Type', 'application/zip');

    //     archive.pipe(res);

    //     for (const filePath of application.successful) {
    //         archive.file(filePath, { name: '' });
    //     }

    //     await archive.finalize();

    // }

    @TryCatch
    public async createApplication (req: Request) {
        const application = await this.doCreateApplication(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully submitted an application.',
            result: application
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async uploadSuccessfulDocs (req: Request) {
        await this.doUploadSuccessDocs(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully uploaded documents.'
        };
      
        return Promise.resolve(response);
    };

    private async doCreateApplication(req: Request): Promise<HttpResponse<IApplicationModel>> {
        return new Promise((resolve, reject) => {

            form.parse(req, async (err, fields, files) => {
                const loggedInClient = req.user._id;

                const services: any = [];
                const serviceKeys = Object.keys(fields).filter(key => key.startsWith('services['));

                // Group fields by index
                serviceKeys.forEach(key => {
                    const match = key.match(/^services\[(\d+)]\[(\w+)]$/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        const field = match[2];

                        if (!services[index]) {
                            services[index] = { service: '', docs: null, additionalInformation: '' };
                        }

                        services[index][field] = fields[key];
                    }
                });

                // Add files to the corresponding service
                for (let i = 0; i < services.length; i++) {
                    services[i].docs = [];
                    
                    let fileIndex = 0;
                    while (files[`services[${i}][docs][${fileIndex}]`]) {
                        services[i].docs.push(files[`services[${i}][docs][${fileIndex}]`]);
                        fileIndex++;
                    }
                   
                }

                const serviceBody = {
                    services,
                    paymentType: fields.paymentType
                }

                const { error, value } = Joi.object<IApplicationModel>({
                    services: Joi.array()
                        .items(
                            Joi.object({
                                service: Joi.string().required().label('Service id'),
                                docs: Joi.array().items(Joi.any().label('Documents')).required().label('Documents'),
                                additionalInformation: Joi.string().optional().allow('').label('Additional Information')
                            })
                        ).label('Services')
                }).validate(serviceBody);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                const [client] = await Promise.all([
                    datasources.clientDAOService.findById(loggedInClient)
                ]);

                if(!client)
                    return reject(CustomAPIError.response("Not found", HttpStatus.NOT_FOUND.code));

                let serviceFee = 0;
                let docsLength = 0;
                const actualServices = await Promise.all(value.services.map(async (serviceData, index) => {
                    // const serviceFiles = files[`services[${index}][docs]`] as unknown as formidable.Files;
                    const serviceFiles = serviceData.docs

                    const service = await datasources.servicesDAOService.findById(serviceData.service);
                    // const service = await datasources.servicesDAOService.findByAny({name: serviceData.service});
                    if(!service)
                        return reject(CustomAPIError.response("Service does not exist.", HttpStatus.NOT_FOUND.code))

                    const processedFiles: any = [];
                    for (const file of serviceFiles) {
                        const serviceFile = file as unknown as formidable.File; 

                        const applicationFiles = `${UPLOAD_BASE_PATH}/applications`;

                        const [{ result, error }] = await Promise.all([
                            Generic.handleFiles(serviceFile as unknown as File, applicationFiles)
                        ]);

                        if (error) {
                            return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                        }
                    
                        processedFiles.push(result);

                    }
                    // for (const key of Object.keys(serviceFiles)) {
                        // const serviceFile = serviceFiles[key] as formidable.File;

                    //     const applicationFiles = `${UPLOAD_BASE_PATH}/applications`;

                    //     const [{ result, error }] = await Promise.all([
                    //         Generic.handleFiles(serviceFile as unknown as File, applicationFiles)
                    //     ]);

                    //     if (error) {
                    //         return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                    //     }
                    
                    //     processedFiles.push(result);
                    // }
                    
                    serviceFee += service.cost;
                    docsLength += processedFiles.length;
        
                    return {
                        service: service._id,
                        docs: processedFiles,
                        additionalInformation: serviceData.additionalInformation || '',
                    };
                }));

                const id = await Generic.generateRandomNumberString(10);

                const payload: any = {
                    services: actualServices,
                    paymentType: value.paymentType,
                    client: client._id,
                    fee: serviceFee.toString(),
                    status: ApplicationStatus.Submitted,
                    applicationId: `#${id}`,
                    documentAttached: docsLength
                };

                const application: any = await datasources.applicationDAOService.create(payload as IApplicationModel);

                return resolve({applicationId: application._id} as any)

            })
        })
    };

    private async doUploadSuccessDocs(
        req: Request
      ): Promise<HttpResponse<IApplicationModel>> {
        return new Promise((resolve, reject) => {
          form.parse(req, async (err, fields, files) => {
            const applicationId = req.params.applicationId;
            const userId = req.user._id;
    
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
    
            const [user, application] = await Promise.all([
                datasources.userDAOService.findById(userId),
                datasources.applicationDAOService.findById(applicationId)
            ]);

            const isAllowed = Generic.handleAllowedUser

            if(user && !isAllowed)
                return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

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
            return resolve('result');
          });
        });
    }
}
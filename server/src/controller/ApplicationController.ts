import { appCommonTypes } from "../@types/app-common";
import HttpResponse = appCommonTypes.HttpResponse;
import { TryCatch } from "../decorators";
import Joi from "joi";
import CustomAPIError from "../exceptions/CustomAPIError";
import HttpStatus from "../helpers/HttpStatus";
import datasources from '../services/dao';
import { UPLOAD_BASE_PATH } from "../config/constants";
import formidable from "formidable";
import Application, { ApplicationStatus, IApplicationModel } from "../models/Application";
import Generic from "../utils/Generic";
import { Request } from "express";
import StripeWebhookService from "../services/StripeWebhookService";
import settings from "../config/settings";
import stripe from "../config/StripeConfig";
import { PaymentType } from "../models/Transaction";
import rabbitMqService from "../config/RabbitMQConfig";
import status_template from "../resources/template/email/status_template";
import moment from 'moment-timezone';
import { IChatModel } from "../models/ChatModel";

const webhookService = new StripeWebhookService(settings.stripe.web_hook_secret, rabbitMqService);

const form = formidable({ uploadDir: UPLOAD_BASE_PATH });
form.setMaxListeners(15);

const paymentType = [PaymentType.Application, PaymentType.Appointment]
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        const loggedInUser = req.user._id;

        const { error, value } = Joi.object<any>({
            amount: Joi.number().optional().label("Service Amount"),
            itemId: Joi.string().required().label("Item Id"),
            paymentType: Joi.string().required().label("Payment Type"),
            noOfServices: Joi.number().optional().label("No of services"),
            email: Joi.string().required().label("Email")
        }).validate(req.body);
        if (error)
            return Promise.reject(
              CustomAPIError.response(
                error.details[0].message,
                HttpStatus.BAD_REQUEST.code
              )
            );

        const client = await datasources.clientDAOService.findById(loggedInUser);
        if(!client)
            return Promise.reject(CustomAPIError.response("User does not exist", HttpStatus.NOT_FOUND.code));

        if(!paymentType.includes(value.paymentType)) 
            return Promise.reject(CustomAPIError.response(`Payment type provided is invalid.`, HttpStatus.NOT_FOUND.code))

        let item;
        let transaction;
        let appointmentAmount: any;
        let itemNo: string;

        switch (value.paymentType) {
            case PaymentType.Application:
                if(!value.amount)
                    return Promise.reject(CustomAPIError.response("Amount is required.", HttpStatus.NOT_FOUND.code))
                
                item = await datasources.applicationDAOService.findById(value.itemId);
                if (!item) {
                    return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code));
                }

                transaction = await datasources.transactionDAOService.findByAny({ application: item._id });
                if (transaction && transaction.paid) {
                    return Promise.reject(CustomAPIError.response("The Application has already been paid for.", HttpStatus.BAD_REQUEST.code));
                }
                itemNo = item.applicationId;
                break;

            case PaymentType.Appointment:
                item = await datasources.appointmentDAOService.findById(value.itemId);
                if (!item) {
                    return Promise.reject(CustomAPIError.response("Appointment does not exist.", HttpStatus.NOT_FOUND.code));
                }

                const appointmentTimeWithoutZ = item.time.toISOString().replace('Z', '');
                const actualAppointmentTime = moment(appointmentTimeWithoutZ).tz(timeZone);
                const now = moment.tz(timeZone);

                // Check if the appointment time is in the past
                if (actualAppointmentTime.isBefore(now)) {
                    return Promise.reject(
                        CustomAPIError.response(
                            "Payment cannot be processed as the appointment time is in the past. Please rebook.",
                            HttpStatus.FORBIDDEN.code
                        )
                    );
                }

                // Subtract one hour and check if the appointment is less than an hour away
                const oneHourBeforeAppointment = actualAppointmentTime.clone().subtract(1, 'hour');
                if (now.isAfter(oneHourBeforeAppointment)) {
                    return Promise.reject(
                        CustomAPIError.response(
                            "Payment cannot be processed as the appointment is less than an hour away. Please rebook.",
                            HttpStatus.BAD_REQUEST.code
                        )
                    );
                }

                transaction = await datasources.transactionDAOService.findByAny({ appointment: item._id });
                if (transaction && transaction.paid) {
                    return Promise.reject(CustomAPIError.response("The Appointment has already been paid for.", HttpStatus.BAD_REQUEST.code));
                }

                if(!value.noOfServices || value.noOfServices === 0)
                    return Promise.reject(CustomAPIError.response("Please provide length of services selected.", HttpStatus.NOT_FOUND.code))
                
                const service = await datasources.appointmentConfigDAOService.findByAny({ service: value.noOfServices });
                if(!service)
                    return Promise.reject(CustomAPIError.response("Please add an amount for the selected service length.", HttpStatus.NOT_FOUND.code))
                
                appointmentAmount = +service?.amount;
                itemNo = item.appointmentId;

                break;

            default:
                return Promise.reject(CustomAPIError.response("Invalid payment type.", HttpStatus.BAD_REQUEST.code));
        }

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: value.paymentType === PaymentType.Application ? value.amount * 100 : appointmentAmount * 100,
                currency: 'usd',
                metadata: {
                    itemId: item._id.toString(),
                    paymentType: value.paymentType,
                    recipientEmail: value.email,
                    itemNo,
                    client: client._id.toString()
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
        let message = '';
        try {
            const event = await webhookService.verifyEvent(req);
            const result = await webhookService.handleEvent(event);
    
            if (result.status === 'success') {
                message = 'success';
            } else {
                console.log(result.message, 'error message');
                message = 'error message';
            }
        } catch (error: any) {
            console.log(`Webhook Error: ${error.message}`);
            message = 'Webhook Error';
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
    public async getSingleApplication (req: Request) {
        const applicationId = req.params.applicationId;

        const [application] = await Promise.all([
            datasources.applicationDAOService.findById(applicationId)
        ]);

        if(!application)
            return Promise.reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code))

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful",
            result: application
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

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: "Successful.",
            results: applications,
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

        const client = await datasources.clientDAOService.findById(application.client);

        await datasources.applicationDAOService.updateByAny(
            { _id: application._id },
            { 
                status: value.status, 
                reasonForDecline: value.status === ApplicationStatus.Declined ? value.reasonForDecline : null
            }
        )

        //SEND OTP TO USER EMAIL
        const mail = status_template({
            item: application.applicationId,
            type: 'application',
            status: value.status
        });

        const emailPayload = {
            to: client?.email,
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

    // public async downloadApplicationDocs (req: Request, res: Response) {

    //     const filename = '02b0afab-f469-44b7-b5ef-cc6cef9da010.png';
    //     //console.log(req.body, 'files')
    //     const application = {
    //         successful: [
    //         path.join(__dirname, '../../uploads/photo', filename), // Add your file paths here
    //         // Add more files if needed
    //         ],
    //     };

    //     const archive = archiver('zip', { zlib: { level: 9 } });
    //     const zipFilename = `application_${filename}_docs.zip`;

    //     // Set headers for the response
    //     res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
    //     res.setHeader('Content-Type', 'application/zip');

    //     // Pipe the archive to the response stream
    //     archive.pipe(res);

    //     for (const filePath of application.successful) {
    //         if (fs.existsSync(filePath)) {
    //             const fileNameInZip = path.basename(filePath); // Get the base file name
    //             console.log('Adding file to zip:', filePath);
    //             archive.file(filePath, { name: fileNameInZip });
    //         } else {
    //             console.error('File not found:', filePath);
    //             res.status(404).send('File not found'); // Return 404 if the file does not exist
    //             return; // Stop further processing
    //         }
    //     }

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

    @TryCatch
    public async uploadReviewDocs (req: Request) {
        const files = await this.doUploadReviewDocs(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.CREATED.code,
            message: 'Successfully uploaded document.',
            result: files
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
                    services
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

                const [client, user] = await Promise.all([
                    datasources.clientDAOService.findById(loggedInClient),
                    datasources.userDAOService.findByAny({
                        userType: { $in: ['super-admin'] }
                    })
                ]);

                if(!client)
                    return reject(CustomAPIError.response("Not found", HttpStatus.NOT_FOUND.code));

                const chat = await datasources.chatDAOService.findByAny({
                    members: {$all: [client._id, user?._id]}
                });

                if(value.services.length === 0)
                    return reject(CustomAPIError.response("Services cannot be empty.", HttpStatus.BAD_REQUEST.code));

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
                    client: client._id,
                    fee: serviceFee.toString(),
                    status: ApplicationStatus.Submitted,
                    applicationId: `#${id}`,
                    documentAttached: docsLength
                };

                const application: any = await datasources.applicationDAOService.create(payload as IApplicationModel);

                if(!chat) {
                    await datasources.chatDAOService.create({
                        members: [client._id, user?._id]
                    } as IChatModel);
                }

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
                return reject(CustomAPIError.response("Application does not exist.", HttpStatus.NOT_FOUND.code));

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
    };

    private async doUploadReviewDocs(
        req: Request
      ): Promise<HttpResponse<IApplicationModel>> {
        return new Promise((resolve, reject) => {
          form.parse(req, async (err, fields, files) => {
            const chatId = req.params.chatId;
    
            const { error, value } = Joi.object<any>({
            //   applicationFile: Joi.string().label("Files"),
                applicationFiles: Joi.array().items(Joi.any()).label("Files")
            }).validate(fields);
    
            if (error) {
              return reject(
                CustomAPIError.response(
                  error.details[0].message,
                  HttpStatus.BAD_REQUEST.code
                )
              );
            }
    
            const [chat] = await Promise.all([
                datasources.chatDAOService.findById(chatId)
            ]);

            if(!chat)
                return reject(CustomAPIError.response("Chat does not exist.", HttpStatus.NOT_FOUND.code));

            // const basePath = `${UPLOAD_BASE_PATH}/photo`;

            // const { result: _file, error: fileError } = await Generic.handleFiles(files.applicationFile as unknown as File, basePath);
            // if (fileError) {
            //     return reject(CustomAPIError.response(fileError, HttpStatus.BAD_REQUEST.code));
            // }

            let successApplicationFiles = [];
            for (const key of Object.keys(files)) {
                const serviceFile = files[key] as formidable.File;

                const applicationFiles = `${UPLOAD_BASE_PATH}/photo`;

                const [{ result, error }] = await Promise.all([
                    Generic.handleFiles(serviceFile as unknown as File, applicationFiles)
                ]);

                if (error) continue;
    
              successApplicationFiles.push(result);
            }
    
            //@ts-ignore
            return resolve(successApplicationFiles);
          });
        });
    }
}
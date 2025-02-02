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
import BlogCategory from "../models/BlogCategory";
import formidable, { File } from 'formidable';
import { UPLOAD_BASE_PATH } from "../config/constants";
import { BlogStatus, IBlogModel } from "../models/Blog";
import Author from "../models/Author";
import { IBlogCommentsModel } from "../models/BlogComments";
import { INewsLetterModel, NewsLetterStatus } from "../models/NewsLetter";
import mail_template from "../resources/template/email/newsletter";
import DeBizDocs, { IDeBizDocsModel } from "../models/DeBizDocs";
import { ISubscriberModel, SubscriberStatus } from "../models/Subscriber";
import { ITestimonialModel } from "../models/Testimonial";
import contact_us_template from "../resources/template/email/contactUs";
import rabbitMqService from "../config/RabbitMQConfig";
import BcryptPasswordEncoder = appCommonTypes.BcryptPasswordEncoder;
import { IChatModel } from "../models/ChatModel";
import CalendlyWebhook from "../services/CalendlyWebhook";
import RedisService from "../services/RedisService";
import CalendlyService from "../services/CalendlyService";
import Transaction from "../models/Transaction";

const redisService = new RedisService();

const form = formidable({ uploadDir: UPLOAD_BASE_PATH });
form.setMaxListeners(15);
const blogStatus = [BlogStatus.Archived, BlogStatus.Draft, BlogStatus.Published];
const newsLetterStatus = [NewsLetterStatus.Draft, NewsLetterStatus.Scheduled, NewsLetterStatus.Sent];
const subscriberStatus = [SubscriberStatus.Active, SubscriberStatus.Inactive];

const calendlyWebhookService = new CalendlyWebhook(rabbitMqService);

export default class AdminController {
    private readonly passwordEncoder: BcryptPasswordEncoder | undefined;

    constructor(passwordEncoder?: BcryptPasswordEncoder) {
      this.passwordEncoder = passwordEncoder;
    };

    @TryCatch
    public async booking(req: Request) {
        // const userId = req.user._id;

        const { error, value } = Joi.object<any>({
            appointmentId: Joi.string().required().label('Appointment Id')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const payload = JSON.stringify({ 
            // user: userId,
            appointmentId: value.appointmentId 
        });

        redisService.saveToken('de_calendly', payload, 120);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful',
        };
    
        return Promise.resolve(response);
    }

    @TryCatch
    public async calendlyWebhook(req: Request) {
        let message = '';
        try {
            const event = await calendlyWebhookService.handleCalendlyEvent(req.body)
            if(event.status === 'active') {
                message = 'success';
            } else {
                console.log(event.message, 'error message');
                message = 'error message: something went wrong';
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
    public async calendlyEvent(req: Request) {
        const { accessToken } = req.user.calendly;
        const eventId = req.params.eventId;

        const calendlyService = new CalendlyService(accessToken);

        const { resource } = await calendlyService.getUserScheduledEvent(eventId);

        const event = await Generic.formatEventDateTime(resource);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: event
        };
    
        return Promise.resolve(response);
    }

    @TryCatch
    public async cancelEvent(req: Request) {
        const { accessToken } = req.user.calendly;

        const isAllowed = await Generic.handleAllowedAppointmentUser(req.user.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const eventId = req.params.eventId;
        const { reason } = req.body;
        const calendlyService = new CalendlyService(accessToken);

        const resource = await calendlyService.cancelEvent(eventId, reason);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: resource
        };
    
        return Promise.resolve(response);
    }

    @TryCatch
    public async noShow(req: Request) {
        const { accessToken } = req.user.calendly;
        const { no_show_uri } = req.body;

        const isAllowed = await Generic.handleAllowedAppointmentUser(req.user.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const calendlyService = new CalendlyService(accessToken);

        const { resource } = await calendlyService.markAsNoShow(no_show_uri);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: resource
        };
    
        return Promise.resolve(response);
    }

    @TryCatch
    public async findChat(req: Request) {
        const userId = req.user._id;

        const { error, value } = Joi.object<any>({
            receiverId: Joi.string().optional().allow('').label('Receiver Id')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        let member = '';
        if(!value.receiverId) {
            const user = await datasources.userDAOService.findByAny({
                userType: { $in: ['super-admin'] }
            })
            member = user?._id.toString()
        } else {
            member = value.receiverId
        }

        const chat = await datasources.chatDAOService.findByAny({
            members: {$all: [userId, member]}
        });
    
        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: chat?._id
        };
    
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchChatMessages(req: Request) {
        const userId = req.user._id;

        const { error, value } = Joi.object<any>({
            chatId: Joi.string().required().label('Chat Id')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const chatMessages = await datasources.chatMessageDAOService.findAll({
            // members: {$all: [userId, value.receiverId]}
            chatId: value.chatId
        }, {sort: { createdAt: 1 }});

        const chat = await datasources.chatDAOService.findById(value.chatId);

        const recipientId = chat?.members.find(id => id !== userId.toString())

        const recipient = await datasources.userDAOService.findById(recipientId)
                            ?? await datasources.clientDAOService.findById(recipientId)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: { chatMessages, recipient: {
                fullName: `${recipient?.firstName} ${recipient?.lastName}`,
                image: recipient?.image,
                id: recipient?._id
            }}
        };
    
        return Promise.resolve(response);
    }       

    @TryCatch
    public async createChat(req: Request) {
        const userId = req.user._id;

        const { error, value } = Joi.object<any>({
            receiverId: Joi.string().required().label('Receiver Id')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const chat = await datasources.chatDAOService.findByAny({
            members: {$all: [userId, value.receiverId]}
        });

        if(chat)
            return Promise.reject(CustomAPIError.response("Chat already exist.", HttpStatus.BAD_REQUEST.code))

        await datasources.chatDAOService.create({
            members: [userId, value.receiverId]
        } as IChatModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created chat.'
        };
      
        return Promise.resolve(response);
          
    }

    @TryCatch
    public async createService (req: Request) {
        await this.doCreateService(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async updateService (req: Request) {
        await this.doUpdateService(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated.'
        };
      
        return Promise.resolve(response);
    };

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

        const [user, applications, appointments, clientsCount, applicationCount, appointmentCount, transaction] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.applicationDAOService.findAll({ 
                status: ApplicationStatus.Submitted
            }, searchOptions),
            datasources.appointmentDAOService.findAll({
                status: { $in: [AppointmentStatus.Upcoming] }
            }, searchOptions),
            Client.count(),
            Application.count(),
            Appointment.count(),
            Transaction.aggregate([
                { $match: { status: "paid" } },
                { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
            ])
        ]);
        
        if(!user)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const totalAmount = (transaction[0]?.totalAmount || 0) / 100;

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: {
                applications, 
                appointments, 
                clientsCount, 
                applicationCount, 
                appointmentCount,
                transaction: totalAmount
            }
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async getSingleClient(req: Request) {
        const clientId = req.params.clientId;

        const [client] = await Promise.all([
            datasources.clientDAOService.findById(clientId)
        ]);

        if(!client)
            return Promise.reject(CustomAPIError.response("Client does not exist", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: client
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async deleteClient(req: Request) {
        const clientId = req.params.clientId;
        const userId = req.user._id;

        const [user, client] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.clientDAOService.findById(clientId)
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!client)
            return Promise.reject(CustomAPIError.response("Client does not exist", HttpStatus.NOT_FOUND.code));

        await datasources.clientDAOService.deleteById(client._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully deleted client.`
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async getAllClients(req: Request) {

        const userId = req.user._id;

        const [user, clients] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.clientDAOService.findAll({})
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successful.`,
            result: clients
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

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(clientEmail)
            return Promise.reject(CustomAPIError.response(`Client with this email: ${value.email} already exists.`, HttpStatus.NOT_FOUND.code));
        if(clientCompanyName)
            return Promise.reject(CustomAPIError.response(`Client with this company name: ${value.companyName} already exists.`, HttpStatus.NOT_FOUND.code));

        const password = await this.passwordEncoder?.encode(process.env.CLIENT_PASS as string);

        const payload = {
            ...value,
            password,
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

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
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
    // START HERE //
    @TryCatch
    public async createBlogCategory (req: Request) {
        const loggedInUser = req.user._id;

        const { error, value } = Joi.object<any>({
            name: Joi.string().required().label('Name')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user] = await Promise.all([
            datasources.userDAOService.findById(loggedInUser)
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const blogCategoryExist = await BlogCategory.findOne({ name: value.name.toLowerCase() });
        if(blogCategoryExist) 
            return Promise.reject(CustomAPIError.response("Blog category already exist.", HttpStatus.BAD_REQUEST.code))
    
        await BlogCategory.create({name: value.name.toLowerCase()});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created blog category.'
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async deleteBlogCategory (req: Request) {
        const loggedInUser = req.user._id;
        const blogCatId = req.params.blogCatId;

        const [user, blogCat, blogs] = await Promise.all([
            datasources.userDAOService.findById(loggedInUser),
            BlogCategory.findById(blogCatId),
            datasources.blogDAOService.findAll({})
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!blogCat)
            return Promise.reject(CustomAPIError.response("Blog category not found.", HttpStatus.NOT_FOUND.code));

        for (const blog of blogs) {
            if (blog.category._id.toString() === blogCat._id.toString()) {
                return Promise.reject(CustomAPIError.response(
                    "This blog category cannot be deleted as it is currently assigned to one or more blogs.",
                    HttpStatus.NOT_FOUND.code
              ));
            }
        }

        await BlogCategory.findByIdAndDelete(blogCat._id);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted blog category.'
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async updateBlogCategory (req: Request) {
        const loggedInUser = req.user._id;
        const blogCatId = req.params.blogCatId;

        const { error, value } = Joi.object<any>({
            name: Joi.string().label('Name')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [user, category] = await Promise.all([
            datasources.userDAOService.findById(loggedInUser),
            BlogCategory.findById(blogCatId)
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if (value.name && value.name !== category.name) {
            const existingCategory = await BlogCategory.findOne({ name: value.name.toLowerCase() });
            if (existingCategory) {
                return Promise.reject(CustomAPIError.response("A category with this name already exists.", HttpStatus.FORBIDDEN.code));
            }
        }
        
        await BlogCategory.findOneAndUpdate({_id: category._id}, {name: value.name.toLowerCase()});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated blog category.'
        };

        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchBlogCategories () {
        
        const categories = await BlogCategory.find({});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: categories
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async getSingleBlogCategory (req: Request) {
        const blogCatId = req.params.blogCatId;
        const category = await BlogCategory.findById(blogCatId);

        if(!category)
            return Promise.reject(CustomAPIError.response("Blog category not found.", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: category
        };

        return Promise.resolve(response);
    }

    @TryCatch
    public async createBlog (req: Request) {
        const blog = await this.doCreateBlog(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created.',
            result: blog
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async updateBlog (req: Request) {
        const blog = await this.doUpdateBlog(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated.',
            result: blog
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async commentOnBlog (req: Request) {
        const blogId = req.params.blogId;

        const { error, value } = Joi.object<IBlogCommentsModel>({
            comment: Joi.string().required().label('Comment')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const [blog] = await Promise.all([
            datasources.blogDAOService.findById(blogId)
        ]);

        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        const blogComment = await datasources.blogCommentsDAOService.create(
            { 
                comment: value.comment,
                blog: blog._id
            } as IBlogCommentsModel);

        blog.comments.push(blogComment._id);
        await blog.save();

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully commented.'
        };
      
        return Promise.resolve(response);
        
    }

    @TryCatch
    public async deleteBlog (req: Request) {
        const userId = req.user._id;
        const blogId = req.params.blogId;

        const [user, blog] = await Promise.all([
            datasources.userDAOService.findById(userId),
            datasources.blogDAOService.findById(blogId)
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        const commentIds = blog.comments;
        await Promise.all(commentIds.map(commentId => datasources.blogCommentsDAOService.deleteById(commentId)));

        await datasources.blogDAOService.deleteById(blog._id);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted blog and its comments.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchBlogs () {

        const blogs = await datasources.blogDAOService.findAll({});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully retrieved blogs.',
            results: blogs
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async likeBlog (req: Request) {
        const blogId = req.params.blogId;

        const [blog] = await Promise.all([
            datasources.blogDAOService.findById(blogId)
        ]);

        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        blog.likes++;
        await blog.save();

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully liked blog.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchBlogComments (req: Request) {
        const blogId = req.params.blogId

        const comments = await datasources.blogCommentsDAOService.findAll({ blog: blogId });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully retrieved comments.',
            results: comments
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async changeBlogStatus(req: Request) {
        const blogId = req.params.blogId;

        const { error, value } = Joi.object<IBlogModel>({
            status: Joi.string().required().label('Status')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const blog = await datasources.blogDAOService.findById(blogId);
        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        if(!blogStatus.includes(value.status)) 
            return Promise.reject(CustomAPIError.response(`Blog status provided is invalid.`, HttpStatus.NOT_FOUND.code))

        await datasources.blogDAOService.updateByAny({ _id: blog._id}, { status: value.status });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed status to ${value.status}.`
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async singleBlogAdmin (req: Request) {
 
        const blogId = req.params.blogId;

        const blog = await datasources.blogDAOService.findById(blogId);
        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully retrieved blog.',
            result: blog
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async singleBlog (req: Request) {
 
        const blogId = req.params.blogId;

        const blog = await datasources.blogDAOService.findByAny({urlSlug: `/${blogId}`});
        if(!blog)
            return Promise.reject(CustomAPIError.response("Blog not found", HttpStatus.NOT_FOUND.code));

        const commentIds = blog.comments;
        const comments = await Promise.all(commentIds.map(commentId => datasources.blogCommentsDAOService.findById(commentId)));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully retrieved blog and comments.',
            result: { blog, comments }
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async getSingleAuthor(req: Request) {
        const authorId = req.params.authorId;

        const author = await Author.findOne({ _id: authorId });

        if(!author)
            return Promise.reject(CustomAPIError.response("Author does not exist", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: author
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchAuthors(req: Request) {

        const authors = await Author.find();

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: authors
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async deleteAuthor(req: Request) {
        const authorId = req.params.authorId;

        const author = await Author.findOne({ _id: authorId });

        if(!author)
            return Promise.reject(CustomAPIError.response("Author does not exist", HttpStatus.NOT_FOUND.code));

        await Author.findByIdAndDelete(authorId)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted author.'
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async createAuthor (req: Request) {
        await this.doCreateAuthor(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async updateAuthor (req: Request) {
        await this.doUpdateAuthor(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated author.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async getSingleNewsLetter(req: Request) {
        const newsletterId = req.params.newsletterId;

        const newsLetter = await datasources.newsLetterDAOService.findById(newsletterId);

        if(!newsLetter)
            return Promise.reject(CustomAPIError.response("Newsletter does not exist", HttpStatus.NOT_FOUND.code));

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: newsLetter
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async fetchNewsletters(req: Request) {

        const newsLetters = await datasources.newsLetterDAOService.findAll();

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: newsLetters
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async deleteNewsletter(req: Request) {
        const newsletterId = req.params.newsletterId;

        const newsletter = await datasources.newsLetterDAOService.findById(newsletterId);

        if(!newsletter)
            return Promise.reject(CustomAPIError.response("Newsletter does not exist", HttpStatus.NOT_FOUND.code));

        await datasources.newsLetterDAOService.deleteById(newsletter._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted newsletter.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async changeNewsLetterStatus(req: Request) {
        const newsletterId = req.params.newsletterId;

        const { error, value } = Joi.object<any>({
            status: Joi.string().required().label('Status'),
            scheduledDate: Joi.date().optional().allow(null).label('Schedule Date')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        if(!newsLetterStatus.includes(value.status)) 
            return Promise.reject(CustomAPIError.response(`News letter status provided is invalid.`, HttpStatus.NOT_FOUND.code))

        const newsLetter = await datasources.newsLetterDAOService.findById(newsletterId);
        if(!newsLetter)
            return Promise.reject(CustomAPIError.response("News letter not found", HttpStatus.NOT_FOUND.code));

        const subscribers = await datasources.subscriberDAOService.findAll({ status: SubscriberStatus.Active })

        if(value.status === NewsLetterStatus.Scheduled && !value.scheduledDate) 
            return Promise.reject(CustomAPIError.response(`Scheduled date is required.`, HttpStatus.NOT_FOUND.code));

        const selectedDate = new Date(value.scheduledDate);
        const currentDate = new Date()

        selectedDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate < currentDate) {
            return Promise.reject(
                CustomAPIError.response(
                    "Scheduled date can not be less than the current date or time.",
                    HttpStatus.FORBIDDEN.code
                )
            );
        }

        await datasources.newsLetterDAOService.updateByAny({ _id: newsLetter._id}, { 
            status: {
                item: value.status,
                date: value.status === NewsLetterStatus.Scheduled 
                        ? value.scheduledDate
                        : null
            }
        });

        const subscribedUsers = subscribers?.map((data: any) => data.email);

        const mail = mail_template({
            content: newsLetter.content
        });

        if(value.status === NewsLetterStatus.Sent && subscribedUsers.length > 0) {
            const emailPayload = {
                to: subscribedUsers.join(', '),
                replyTo: process.env.SMTP_EMAIL_FROM,
                from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                subject: `De Business Consult News Letter.`,
                html: mail
            };
            await rabbitMqService.sendEmail({data: emailPayload});
        }

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: `Successfully changed status to ${value.status}.`
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async createNewsLetter (req: Request) {
        await this.doCreateNewsletter(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created news letter.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async updateNewsLetter (req: Request) {
        await this.doUpdateNewsletter(req);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated news letter.'
        };
      
        return Promise.resolve(response);
    };

    @TryCatch
    public async createDeDocs(req: Request) {

        const { error, value } = Joi.object<any>({
            termsAndCondition: Joi.string().optional().allow('').label('Terms and Condition'),
            aboutUs: Joi.string().optional().allow('').label('About Us'),
            contactUs: Joi.string().optional().allow('').label('Contact Us'),
            socialMedia: Joi.object({
                fb: Joi.string().optional().allow(''),
                x: Joi.string().optional().allow(''),
                youtube: Joi.string().optional().allow(''),
                linkedIn: Joi.string().optional().allow(''),
                ig: Joi.string().optional().allow(''),
                dribble: Joi.string().optional().allow('')
            }).optional().label('Terms and Condition'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const deDocs = await DeBizDocs.findOne({});
        if(deDocs) 
            return Promise.reject(CustomAPIError.response("Document already exists.", HttpStatus.CONFLICT.code))

        const payload = {
            ...value
        }

        await datasources.deBizDocsDAOService.create(payload as IDeBizDocsModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created.',
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async contactUsForm(req: Request) {

        const { error, value } = Joi.object<any>({
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            email: Joi.string().required().label('Email'),
            phone: Joi.string().required().label('Phone'),
            message: Joi.string().required().label('Message'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const mail = contact_us_template({
            message: value.message,
            fullName: `${value.firstName} ${value.lastName}`,
            email: value.email,
            phone: value.phone
        });

        const emailPayload = {
            to: process.env.SMTP_EMAIL_FROM,
            replyTo: process.env.SMTP_EMAIL_FROM,
            from: `${value.firstName} ${value.lastName} <${value.email}>`,
            subject: `Contact us email.`,
            html: mail
        };
        await rabbitMqService.sendEmail({data: emailPayload});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async updateDeDocs(req: Request) {

        const { error, value } = Joi.object<any>({
            termsAndCondition: Joi.string().optional().allow('').label('Terms and Condition'),
            aboutUs: Joi.string().optional().allow('').label('About Us'),
            contactUs: Joi.string().optional().allow('').label('Contact Us'),
            socialMedia: Joi.object({
                fb: Joi.string().optional().allow(''),
                x: Joi.string().optional().allow(''),
                youtube: Joi.string().optional().allow(''),
                linkedIn: Joi.string().optional().allow(''),
                ig: Joi.string().optional().allow(''),
                dribble: Joi.string().optional().allow('')
            }).optional().label('Terms and Condition'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const deDocs = await DeBizDocs.findOne({});
        if(!deDocs)
            return Promise.reject(CustomAPIError.response('Does not exist.', HttpStatus.NOT_FOUND.code));

        const payload = {
            termsAndCondition: {
                content: value.termsAndCondition ? value.termsAndCondition : deDocs.termsAndCondition.content,
                dateUpdated: value.termsAndCondition ? new Date() : deDocs.termsAndCondition.dateUpdated
            },
            aboutUs: value.aboutUs ? value.aboutUs : deDocs.aboutUs,
            contactUs: value.contactUs ? value.contactUs : deDocs.contactUs,
            socialMedia: value.socialMedia ? value.socialMedia : deDocs.socialMedia
        }

        await datasources.deBizDocsDAOService.update({ _id: deDocs._id }, payload);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async getDocs(req: Request) {
        const docs = await DeBizDocs.findOne({});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: docs
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async createSubscriber(req: Request) {

        const { error, value } = Joi.object<ISubscriberModel>({
            firstName: Joi.string().optional().allow('').label('First Name'),
            lastName: Joi.string().optional().allow('').label('Last Name'),
            email: Joi.string().required().label('Email'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const subscriber = await datasources.subscriberDAOService.findByAny({ email: value.email });
        if(subscriber) 
            return Promise.reject(CustomAPIError.response("Subscriber with this email already exists.", HttpStatus.CONFLICT.code))

        const payload: Partial<ISubscriberModel> = {
            ...value
        }

        await datasources.subscriberDAOService.create(payload as ISubscriberModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created a subscriber.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async updateSubscriber(req: Request) {
        const subscriberId = req.params.subscriberId;

        const { error, value } = Joi.object<ISubscriberModel>({
            firstName: Joi.string().label('First Name'),
            lastName: Joi.string().label('Last Name'),
            email: Joi.string().label('Email'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const subscriber = await datasources.subscriberDAOService.findById(subscriberId);
        if(!subscriber) 
            return Promise.reject(CustomAPIError.response("Subscriber does not exist.", HttpStatus.NOT_FOUND.code));

        if (value.email.toLowerCase() && value.email.toLowerCase() !== subscriber.email) {
            const existingSubscriber = await datasources.subscriberDAOService.findByAny({ email: value.email.toLowerCase() });
            if (existingSubscriber) {
                return Promise.reject(CustomAPIError.response("A subscriber with this email already exists.", HttpStatus.CONFLICT.code));
            }
        }

        const payload = {
            firstName: value.firstName ? value.firstName : subscriber.firstName,
            lastName: value.lastName ? value.lastName : subscriber.lastName,
            email: value.email ? value.email : subscriber.email
        }

        await datasources.subscriberDAOService.update({ _id: subscriber._id }, payload);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated subscriber.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async getSingleSubscriber(req: Request) {
        const subscriberId = req.params.subscriberId;

        const subscriber = await datasources.subscriberDAOService.findById(subscriberId);
        if(!subscriber)
            return Promise.reject(CustomAPIError.response("Subscriber not found", HttpStatus.NOT_FOUND.code))

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: subscriber
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchSubscribers(req: Request) {

        const subscribers = await datasources.subscriberDAOService.findAll({});

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: subscribers
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async deleteSubscriber(req: Request) {
        const subscriberId = req.params.subscriberId;

        const subscriber = await datasources.subscriberDAOService.findById(subscriberId);
        if(!subscriber)
            return Promise.reject(CustomAPIError.response("Subscriber not found", HttpStatus.NOT_FOUND.code));

        await datasources.subscriberDAOService.deleteById(subscriber._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted subscriber.'
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async changeSubscriberStatus(req: Request) {
        const subscriberId = req.params.subscriberId;

        const { error, value } = Joi.object<any>({
            status: Joi.string().required().label('Status')
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        if(!subscriberStatus.includes(value.status)) 
            return Promise.reject(CustomAPIError.response(`Subscriber status provided is invalid.`, HttpStatus.NOT_FOUND.code));

        const subscriber = await datasources.subscriberDAOService.findById(subscriberId);
        if(!subscriber)
            return Promise.reject(CustomAPIError.response("Subscriber does not exist.", HttpStatus.NOT_FOUND.code));

        await datasources.subscriberDAOService.updateByAny({ _id: subscriber._id }, { status: value.status });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully changed status.'
        };
      
        return Promise.resolve(response);
    }

    @TryCatch
    public async createTestimonial(req: Request) {

        const { error, value } = Joi.object<ITestimonialModel>({
            firstName: Joi.string().required().label('First Name'),
            lastName: Joi.string().required().label('Last Name'),
            content: Joi.string().required().label('Content'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const payload: Partial<ITestimonialModel> = {
            ...value
        }

        await datasources.testimonialDAOService.create(payload as ITestimonialModel);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully created testimonial.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async toggleTestimonialStatus(req: Request) {
        const testimonialId = req.params.testimonialId;
        const loggedInUser = req.user._id;

        const [user, testimonial] = await Promise.all([
            datasources.userDAOService.findById(loggedInUser),
            datasources.testimonialDAOService.findById(testimonialId)
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code)); 

        if(!testimonial)
            return Promise.reject(CustomAPIError.response("Testimonial does not exist.", HttpStatus.NOT_FOUND.code));

        await datasources.testimonialDAOService.updateByAny({ _id: testimonial._id }, { status: !testimonial.status });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async updateTestimonial(req: Request) {
        const testimonialId = req.params.testimonialId;

        const { error, value } = Joi.object<ITestimonialModel>({
            firstName: Joi.string().label('First Name'),
            lastName: Joi.string().label('Last Name'),
            content: Joi.string().label('Content'),
        }).validate(req.body);
        if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

        const testimonial = await datasources.testimonialDAOService.findById(testimonialId);
        if(!testimonial) 
            return Promise.reject(CustomAPIError.response("Testimonial does not exist.", HttpStatus.NOT_FOUND.code));

        const payload = {
            firstName: value.firstName ? value.firstName : testimonial.firstName,
            lastName: value.lastName ? value.lastName : testimonial.lastName,
            content: value.content ? value.content : testimonial.content
        }

        await datasources.testimonialDAOService.update({ _id: testimonial._id }, payload);

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully updated testimonial.'
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async getSingleTestimonial(req: Request) {
        const testimonialId = req.params.testimonialId;

        const testimonial = await datasources.testimonialDAOService.findById(testimonialId);
        if(!testimonial)
            return Promise.reject(CustomAPIError.response("Testimonial not found", HttpStatus.NOT_FOUND.code))

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            result: testimonial
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchTestimonialsAdmin(req: Request) {
        const loggedInUser = req.user._id;

        const [user, testimonials] = await Promise.all([
            datasources.userDAOService.findById(loggedInUser),
            datasources.testimonialDAOService.findAll({})
        ]);

        const isAllowed = await Generic.handleAllowedUser(user && user.userType)
        if(user && !isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code)); 

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: testimonials
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async fetchTestimonialsClient(req: Request) {

        const testimonials = await datasources.testimonialDAOService.findAll({ status: true });

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successful.',
            results: testimonials
        };
      
        return Promise.resolve(response);

    }

    @TryCatch
    public async deleteTestimonial(req: Request) {
        const testimonialId = req.params.testimonialId;
        const userId = req.user._id;

        const user = await datasources.userDAOService.findById(userId);
        if(!user)
            return Promise.reject(CustomAPIError.response("User does not exist.", HttpStatus.NOT_FOUND.code)); 

        const isAllowed = await Generic.handleAllowedUser(user.userType)
        if(!isAllowed)
            return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

        const testimonial = await datasources.testimonialDAOService.findById(testimonialId);
        if(!testimonial)
            return Promise.reject(CustomAPIError.response("Testimonial not found", HttpStatus.NOT_FOUND.code));

        await datasources.testimonialDAOService.deleteById(testimonial._id)

        const response: HttpResponse<any> = {
            code: HttpStatus.OK.code,
            message: 'Successfully deleted testimonial.'
        };
      
        return Promise.resolve(response);
    }

    private async doCreateNewsletter(req: Request): Promise<HttpResponse<INewsLetterModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;

                const { error, value } = Joi.object<any>({
                    content: Joi.string().required().label('Content'),
                    docs: Joi.array().items(Joi.string()).label("Documents"),
                    status: Joi.string().required().label('Status'),
                    scheduledDate: Joi.date().optional().allow(null).label('Schedule Date')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                if(!newsLetterStatus.includes(value.status)) 
                    return reject(CustomAPIError.response(`News letter status provided is invalid.`, HttpStatus.NOT_FOUND.code));

                if(value.status === NewsLetterStatus.Scheduled && !value.scheduledDate) 
                    return reject(CustomAPIError.response(`Scheduled date is required.`, HttpStatus.NOT_FOUND.code));

                const selectedDate = new Date(value.scheduledDate);
                const currentDate = new Date()

                selectedDate.setHours(0, 0, 0, 0);
                currentDate.setHours(0, 0, 0, 0);

                if (selectedDate < currentDate) {
                    return reject(
                        CustomAPIError.response(
                            "Scheduled date can not be less than the current date or time.",
                            HttpStatus.FORBIDDEN.code
                        )
                    );
                }
                const [user, subscribers] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser),
                    datasources.subscriberDAOService.findAll()
                ]);

                const isAllowed = await Generic.handleAllowedUser(user && user.userType)
                if(user && !isAllowed)
                    return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                const basePath = `${UPLOAD_BASE_PATH}/photo`;

                let newsLetterFiles: any[] = [];

                for (const key of Object.keys(files)) {
                    const imageFile = files[key] as any;

                    const [{ result, error }] = await Promise.all([
                        Generic.handleFiles(imageFile as File, basePath)
                    ]);

                    if (error) {
                        return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                    }
                
                    newsLetterFiles.push(result);
                };

                const subscribedUsers = subscribers.map((data) => data.email);

                const payload = {
                    content: value.content,
                    files: newsLetterFiles.length > 0 ? newsLetterFiles : [],
                    status: {
                        item: value.status,
                        date: value.status === NewsLetterStatus.Scheduled ? value.scheduledDate : null
                    }
                }

                const newsLetter = await datasources.newsLetterDAOService.create(payload as INewsLetterModel);

                const mail = mail_template({
                    content: newsLetter.content
                });

                if(value.status === NewsLetterStatus.Sent && subscribedUsers.length > 0) {
                    const emailPayload = {
                        to: subscribedUsers.join(', '),
                        replyTo: process.env.SMTP_EMAIL_FROM,
                        from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL_FROM}>`,
                        subject: `De Business Consult News Letter.`,
                        html: mail
                    };
                    await rabbitMqService.sendEmail({data: emailPayload});
                }

                return resolve('news letter' as any)

            })
        })
    }

    private async doUpdateNewsletter(req: Request): Promise<HttpResponse<INewsLetterModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;
                const newsLetterId = req.params.newsLetterId;

                const { error, value } = Joi.object<any>({
                    content: Joi.string().optional().allow('').label('Content'),
                    docs: Joi.array().items(Joi.string()).label("Documents"),
                    scheduledDate: Joi.date().optional().allow(null).label('Schedule Date')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                if(!newsLetterStatus.includes(value.status)) 
                    return reject(CustomAPIError.response(`News letter status provided is invalid.`, HttpStatus.NOT_FOUND.code));

                if(value.status === NewsLetterStatus.Scheduled && !value.scheduledDate) 
                    return reject(CustomAPIError.response(`Scheduled date is required.`, HttpStatus.NOT_FOUND.code));

                const selectedDate = new Date(value.scheduledDate);
                const currentDate = new Date()

                selectedDate.setHours(0, 0, 0, 0);
                currentDate.setHours(0, 0, 0, 0);

                if (selectedDate < currentDate) {
                    return Promise.reject(
                        CustomAPIError.response(
                            "Scheduled date can not be less than the current date or time.",
                            HttpStatus.FORBIDDEN.code
                        )
                    );
                }

                const [user, newsLetter] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser),
                    datasources.newsLetterDAOService.findById(newsLetterId)
                ]);

                if(!newsLetter)
                    return reject(CustomAPIError.response("Newsletter does exist", HttpStatus.NOT_FOUND.code))

                if(newsLetter.status.item === NewsLetterStatus.Sent) 
                    return reject(CustomAPIError.response(`You can not update a newsletter that is already published.`, HttpStatus.FORBIDDEN.code));

                const isAllowed = await Generic.handleAllowedUser(user && user.userType)
                if(user && !isAllowed)
                    return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                const basePath = `${UPLOAD_BASE_PATH}/photo`;

                let newsLetterFiles: any[] = [];

                for (const key of Object.keys(files)) {
                    const imageFile = files[key] as any;

                    const [{ result, error }] = await Promise.all([
                        Generic.handleFiles(imageFile as File, basePath)
                    ]);

                    if (error) {
                        return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                    }
                
                    newsLetterFiles.push(result);
                };

                const payload = {
                    content: value.content ? value.content : newsLetter.content,
                    files: newsLetterFiles.length > 0 ? newsLetterFiles : newsLetter.files,
                    status: {
                        item: value.status ? value.status : newsLetter.status.item,
                        date: value.scheduledDate ? value.scheduledDate : newsLetter.status.date
                    }
                }

                await datasources.newsLetterDAOService.updateByAny({ _id: newsLetter._id }, payload);

                return resolve('news letter' as any)

            })
        })
    }

    private async doCreateAuthor(req: Request): Promise<HttpResponse<IBlogModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;

                const { error, value } = Joi.object<any>({
                    name: Joi.string().required().label('Name'),
                    jobTitle: Joi.string().required().label('Job Title'),
                    image: Joi.any().label('Image')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));
 
                const [user] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser)
                ]);

                const isAllowed = await Generic.handleAllowedBlogUser(user && user.userType)
                if(user && !isAllowed)
                    return reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                const basePath = `${UPLOAD_BASE_PATH}/photo`;
                const [{ result: authorImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.image as File, basePath)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }

                const payload = {
                    name: value.name.toLowerCase(),
                    jobTitle: value.jobTitle,
                    image: authorImage ? authorImage : ''
                }

                await Author.create(payload)

                return resolve('author' as any)

            })
        })
    }

    private async doUpdateAuthor(req: Request): Promise<HttpResponse<IBlogModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;
                const authorId = req.params.authorId;

                const { error, value } = Joi.object<any>({
                    name: Joi.string().label('Name'),
                    jobTitle: Joi.string().label('Job Title'),
                    image: Joi.any().label('Image')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));
 
                const [user, author] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser),
                    Author.findById(authorId)
                ]);

                if(!author)
                    return reject(CustomAPIError.response("Author does not exist.", HttpStatus.NOT_FOUND.code));

                const isAllowed = await Generic.handleAllowedBlogUser(user && user.userType)
                if(user && !isAllowed)
                    return reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                const basePath = `${UPLOAD_BASE_PATH}/photo`;
                const [{ result: authorImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.titleImage as File, basePath)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }

                const payload = {
                    name: value.name ? value.name.toLowerCase() : author.name,
                    jobTitle: value.jobTitle ?  value.jobTitle : author.jobTitle,
                    image: authorImage ? authorImage : ''
                }

                await Author.updateOne({ _id: author._id }, payload)

                return resolve('author' as any)

            })
        })
    }

    private async doCreateService(req: Request): Promise<HttpResponse<IServicesModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const userId = req.user._id;
                const { error, value } = Joi.object<IServicesModel>({
                    name: Joi.string().required().label('Service name'),
                    cost: Joi.string().required().label('Cost'),
                    description: Joi.string().required().label('Description'),
                    image: Joi.any().label('Service image')
                }).validate(fields);
                if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));
        
                const [user, service] = await Promise.all([
                    datasources.userDAOService.findById(userId),
                    datasources.servicesDAOService.findByAny({ name: value.name.toLowerCase() })
                ]);

                const isAllowed = await Generic.handleAllowedUser(user && user.userType)
                if(user && !isAllowed)
                    return reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));
        
                if(service)
                    return reject(CustomAPIError.response('Service name already exist.', HttpStatus.NOT_FOUND.code));

                const basePath = `${UPLOAD_BASE_PATH}/photo`;
                const [{ result: serviceImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.image as File, basePath)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }
        
                const payload = {
                    ...value,
                    name: value.name.toLowerCase(),
                    image: serviceImage ? serviceImage : ''
                }
        
                await datasources.servicesDAOService.create(payload as IServicesModel);

                return resolve('service' as any)

            })
        })
    }

    private async doUpdateService(req: Request): Promise<HttpResponse<IServicesModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const serviceId = req.params.serviceId;
                const userId = req.user._id;

                const { error, value } = Joi.object<IServicesModel>({
                    name: Joi.string().optional().allow('').label('Service name'),
                    cost: Joi.string().optional().allow('').label('Cost'),
                    description: Joi.string().optional().allow('').label('Description'),
                    image: Joi.any().label('Service image')
                }).validate(fields);
                if(error) return Promise.reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));
        
                const [user, service] = await Promise.all([
                    datasources.userDAOService.findById(userId),
                    datasources.servicesDAOService.findById(serviceId)
                ]);

                if(!service)
                    return reject(CustomAPIError.response('Service does not exist.', HttpStatus.NOT_FOUND.code));
        
                const isAllowed = await Generic.handleAllowedUser(user && user.userType)
                if(user && !isAllowed)
                    return reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                if (value.name.toLowerCase() && value.name.toLowerCase() !== service.name) {
                    const existingService = await datasources.servicesDAOService.findByAny({ name: value.name.toLowerCase() });
                    if (existingService) {
                        return reject(CustomAPIError.response("A service with this name already exists.", HttpStatus.CONFLICT.code));
                    }
                }

                const basePath = `${UPLOAD_BASE_PATH}/photo`;
                const [{ result: serviceImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.image as File, basePath)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }

                //remove the image from directory
                if(serviceImage && service.image) {
                    await Generic.removeImage(service.image, basePath)
                }
        
                const payload = {
                    name: value.name ? value.name.toLowerCase() : service.name,
                    cost: value.cost ? value.cost : service.cost,
                    description: value.description ? value.description : service.description,
                    image: serviceImage ? serviceImage : service.image
                }
        
                await datasources.servicesDAOService.update({_id: service._id}, payload);

                return resolve('service' as any)

            })
        })
    }

    private async doCreateBlog(req: Request): Promise<HttpResponse<IBlogModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;

                const { error, value } = Joi.object<any>({
                    title: Joi.string().required().label('Title'),
                    urlSlug: Joi.string().required().label('Url slug'),
                    content: Joi.string().required().label('Blog body'),
                    category: Joi.string().required().label('Blog category'),
                    titleImage: Joi.any().label('Title image'),
                    bodyImages: Joi.array().items(Joi.string()).label("images"),
                    author: Joi.string().required().label('Author'),
                    status: Joi.string().optional().allow('').label('status')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));
 
                const [user, category, blogExist, author] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser),
                    BlogCategory.findById(value.category),
                    datasources.blogDAOService.findByAny({urlSlug: value.urlSlug}),
                    Author.findById(value.author),
                ]);

                const isAllowed = await Generic.handleAllowedBlogUser(user && user.userType)
                if(user && !isAllowed)
                    return reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                if(!blogStatus.includes(value.status)) 
                    return reject(CustomAPIError.response(`Blog status provided is invalid.`, HttpStatus.NOT_FOUND.code))

                if(blogExist)
                    return reject(CustomAPIError.response(`A blog with this link: ${process.env.CLIENT_URL}${value.urlSlug} already exist.`, HttpStatus.FORBIDDEN.code))

                if(!author)
                    return reject(CustomAPIError.response(`Author does not exist.`, HttpStatus.FORBIDDEN.code))

                if(!category)
                    return reject(CustomAPIError.response("Category does not exist.", HttpStatus.NOT_FOUND.code));

                const basePathBodyImage = `${UPLOAD_BASE_PATH}/blogbodyimg`;
                const basePathTitleImage = `${UPLOAD_BASE_PATH}/blogtitleimg`;

                let updatedBodyImages: any[] = [];

                for (const key of Object.keys(files)) {
                    if(key === "bodyImages") {
                        const [{ result, error }] = await Promise.all([
                            Generic.handleFiles(files.bodyImages as File, basePathBodyImage)
                        ]);
    
                        if (error) {
                            return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                        }

                        updatedBodyImages.push(result);
                    }
                }

                const [{ result: _titleImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.titleImage as File, basePathTitleImage)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }

                const payload: Partial<IBlogModel> = {
                    ...value,
                    category: category._id,
                    titleImage: _titleImage ? _titleImage : '',
                    bodyImages: updatedBodyImages.length > 0 ? updatedBodyImages : [],
                    author: author._id,
                    status: value.status ? value.status : BlogStatus.Published
                }

                const blog: any = await datasources.blogDAOService.create(payload as IBlogModel);

                return resolve(blog)

            })
        })
    }

    private async doUpdateBlog(req: Request): Promise<HttpResponse<IBlogModel>> {
        return new Promise((resolve, reject) => {
           
            form.parse(req, async (err, fields, files) => {
                const loggedInUser = req.user._id;
                const blogId = req.params.blogId;

                const { error, value } = Joi.object<any>({
                    title: Joi.string().optional().allow('').label('Title'),
                    urlSlug: Joi.string().optional().allow('').label('Url slug'),
                    content: Joi.string().optional().allow('').label('Blog body'),
                    category: Joi.string().optional().allow('').label('Blog category'),
                    titleImage: Joi.any().label('Title image'),
                    bodyImages: Joi.array().items(Joi.string()).label("images"),
                    author: Joi.string().optional().allow('').label('Author'),
                    status: Joi.string().optional().allow('').label('status')
                }).validate(fields);
                if(error) return reject(CustomAPIError.response(error.details[0].message, HttpStatus.BAD_REQUEST.code));

                if(value.status && !blogStatus.includes(value.status)) 
                    return reject(CustomAPIError.response(`Blog status provided is invalid.`, HttpStatus.NOT_FOUND.code))

                const [user, category, blogExist, author, blog] = await Promise.all([
                    datasources.userDAOService.findById(loggedInUser),
                    BlogCategory.findById(value.category),
                    datasources.blogDAOService.findByAny({urlSlug: value.urlSlug}),
                    Author.findById(value.author),
                    datasources.blogDAOService.findById(blogId),
                ]);

                const isAllowed = await Generic.handleAllowedBlogUser(user && user.userType)
                if(user && !isAllowed)
                    return Promise.reject(CustomAPIError.response("Unauthorized.", HttpStatus.UNAUTHORIZED.code));

                if(!blog)
                    return reject(CustomAPIError.response(`Blog does not exist.`, HttpStatus.NOT_FOUND.code))

                if (value.urlSlug && value.urlSlug !== blogExist?.urlSlug) {
                    const existingBlog = await datasources.blogDAOService.findByAny({ urlSlug: value.urlSlug });
                    if (existingBlog) {
                        return Promise.reject(CustomAPIError.response(`A blog with this link: ${process.env.CLIENT_URL}${value.urlSlug} already exist.`, HttpStatus.CONFLICT.code));
                    }
                }

                if(value.author && !author)
                    return reject(CustomAPIError.response(`Author does not exist.`, HttpStatus.FORBIDDEN.code))

                if(value.category && !category)
                    return reject(CustomAPIError.response("Category does not exist.", HttpStatus.NOT_FOUND.code));

                const basePathBodyImage = `${UPLOAD_BASE_PATH}/blogbodyimg`;
                const basePathTitleImage = `${UPLOAD_BASE_PATH}/blogtitleimg`;

                let updatedBodyImages: any[] = [];

                for (const key of Object.keys(files)) {
                    if(key === "bodyImages") {
                        const [{ result, error }] = await Promise.all([
                            Generic.handleFiles(files.bodyImages as File, basePathBodyImage)
                        ]);
    
                        if (error) {
                            return reject(CustomAPIError.response(error as string, HttpStatus.BAD_REQUEST.code));
                        }

                        updatedBodyImages.push(result);
                    }
                }

                const [{ result: _titleImage, error: imageError }] = await Promise.all([
                    Generic.handleImage(files.titleImage as File, basePathTitleImage)
                ]);
            
                if (imageError) {
                    return reject(CustomAPIError.response(imageError as string, HttpStatus.BAD_REQUEST.code));
                }

                 //remove the image from directory
                if(_titleImage && blog.titleImage) {
                    await Generic.removeImage(blog.titleImage, basePathTitleImage)
                }

                const payload: Partial<IBlogModel> = {
                    title: value.title ? value.title : blog.title,
                    content: value.content ? value.content : blog.content,
                    urlSlug: value.urlSlug ? value.urlSlug : blog.urlSlug,
                    status: value.status ? value.status : blog.status,
                    category: value.category ? category._id : blog.category,
                    titleImage: _titleImage ? _titleImage : blog.titleImage,
                    bodyImages: updatedBodyImages.length > 0 ? [...blog.bodyImages, ...updatedBodyImages] : blog.bodyImages,
                    author: value.author ? author._id : blog.author
                }

                await datasources.blogDAOService.updateByAny({ _id: blog._id }, payload);

                return resolve('blog' as any)

            })
        })
    }
}
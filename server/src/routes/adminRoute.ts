import AdminController from "../controller/AdminController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";
import PasswordEncoder from "../utils/PasswordEncoder";

const passwordEncoder = new PasswordEncoder();
const adminController = new AdminController(passwordEncoder);

export const createChatHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createChat(req);
    res.status(response.code).json(response);
});

export const findChatHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.findChat(req);
    res.status(response.code).json(response);
});

export const fetchChatMessagesHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.fetchChatMessages(req);
    res.status(response.code).json(response);
});

export const createServiceHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createService(req);
    res.status(response.code).json(response);
});

export const updateServiceHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateService(req);
    res.status(response.code).json(response);
});

export const fetchServicesHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchServices(req);
    res.status(response.code).json(response);
};

export const deleteClientHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteClient(req);
    res.status(response.code).json(response);
});

export const getSingleServiceHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getSingleService(req);
    res.status(response.code).json(response);
};

export const deleteServiceHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteService(req);
    res.status(response.code).json(response);
});

export const dashboardDataHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.dashboardData(req);
    res.status(response.code).json(response);
});

export const createClientHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createClient(req);
    res.status(response.code).json(response);
});

export const toggleClientStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.toggleClientStatus(req);
    res.status(response.code).json(response);
});

export const createBlogCategoryHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createBlogCategory(req);
    res.status(response.code).json(response);
});

export const deleteBlogCategoryHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteBlogCategory(req);
    res.status(response.code).json(response);
});

export const updateBlogCategoryHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateBlogCategory(req);
    res.status(response.code).json(response);
});

export const fetchBlogCategoriesHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchBlogCategories();
    res.status(response.code).json(response);
};

export const getSingleBlogCategoryHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getSingleBlogCategory(req);
    res.status(response.code).json(response);
};

export const createBlogHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createBlog(req);
    res.status(response.code).json(response);
});

export const updateBlogHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateBlog(req);
    res.status(response.code).json(response);
});

export const commentOnBlogHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.commentOnBlog(req);
    res.status(response.code).json(response);
};

export const deleteBlogHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteBlog(req);
    res.status(response.code).json(response);
});

export const fetchBlogsHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchBlogs();
    res.status(response.code).json(response);
};

export const likeBlogHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.likeBlog(req);
    res.status(response.code).json(response);
};

export const fetchBlogCommentsHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchBlogComments(req);
    res.status(response.code).json(response);
};

export const changeBlogStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.changeBlogStatus(req);
    res.status(response.code).json(response);
});

export const singleBlogHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.singleBlog(req);
    res.status(response.code).json(response);
};

export const singleBlogAdminHandler = authenticateRouteWrapper( async (req, res) =>  {
    const response = await adminController.singleBlogAdmin(req);
    res.status(response.code).json(response);
});

export const getSingleAuthorHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getSingleAuthor(req);
    res.status(response.code).json(response);
};

export const fetchAuthorsHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchAuthors(req);
    res.status(response.code).json(response);
};

export const deleteAuthorHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteAuthor(req);
    res.status(response.code).json(response);
});

export const createAuthorHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createAuthor(req);
    res.status(response.code).json(response);
});

export const updateAuthorHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateAuthor(req);
    res.status(response.code).json(response);
});

export const getSingleNewsLetterHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.getSingleNewsLetter(req);
    res.status(response.code).json(response);
});

export const fetchNewslettersHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.fetchNewsletters(req);
    res.status(response.code).json(response);
});

export const deleteNewsletterHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteNewsletter(req);
    res.status(response.code).json(response);
});

export const changeNewsLetterStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.changeNewsLetterStatus(req);
    res.status(response.code).json(response);
});

export const createNewsLetterHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createNewsLetter(req);
    res.status(response.code).json(response);
});

export const updateNewsLetterHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateNewsLetter(req);
    res.status(response.code).json(response);
});

export const createDeDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createDeDocs(req);
    res.status(response.code).json(response);
});

export const updateDeDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateDeDocs(req);
    res.status(response.code).json(response);
});

export const getDocsHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getDocs(req);
    res.status(response.code).json(response);
};

export const createSubscriberHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.createSubscriber(req);
    res.status(response.code).json(response);
};

export const updateSubscriberHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateSubscriber(req);
    res.status(response.code).json(response);
});

export const getSingleSubscriberHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.getSingleSubscriber(req);
    res.status(response.code).json(response);
});

export const fetchSubscribersHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchSubscribers(req);
    res.status(response.code).json(response);
};

export const deleteSubscriberHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteSubscriber(req);
    res.status(response.code).json(response);
});

export const changeSubscriberStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.changeSubscriberStatus(req);
    res.status(response.code).json(response);
});

export const createTestimonialHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.createTestimonial(req);
    res.status(response.code).json(response);
});

export const toggleTestimonialStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.toggleTestimonialStatus(req);
    res.status(response.code).json(response);
});

export const updateTestimonialHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.updateTestimonial(req);
    res.status(response.code).json(response);
});

export const getSingleTestimonialHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getSingleTestimonial(req);
    res.status(response.code).json(response);
};

export const fetchTestimonialsAdminHandler = authenticateRouteWrapper( async (req, res) =>  {
    const response = await adminController.fetchTestimonialsAdmin(req);
    res.status(response.code).json(response);
});

export const fetchTestimonialsClientHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.fetchTestimonialsClient(req);
    res.status(response.code).json(response);
};

export const deleteTestimonialHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.deleteTestimonial(req);
    res.status(response.code).json(response);
});

export const getSingleClientHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.getSingleClient(req);
    res.status(response.code).json(response);
};

export const getAllClientsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await adminController.getAllClients(req);
    res.status(response.code).json(response);
});

export const contactUsFormHandler = async (req: Request, res: Response) =>  {
    const response = await adminController.contactUsForm(req);
    res.status(response.code).json(response);
};
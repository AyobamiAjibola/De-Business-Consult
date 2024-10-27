import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    changeBlogStatusHandler,
    changeNewsLetterStatusHandler,
    changeSubscriberStatusHandler,
    commentOnBlogHandler,
    contactUsFormHandler,
    createAuthorHandler,
    createBlogCategoryHandler,
    createBlogHandler,
    createChatHandler,
    createClientHandler,
    createDeDocsHandler,
    createNewsLetterHandler,
    createServiceHandler, 
    createSubscriberHandler, 
    createTestimonialHandler, 
    dashboardDataHandler, 
    deleteAuthorHandler, 
    deleteBlogCategoryHandler, 
    deleteBlogHandler, 
    deleteClientHandler, 
    deleteNewsletterHandler, 
    deleteServiceHandler, 
    deleteSubscriberHandler, 
    deleteTestimonialHandler, 
    fetchAuthorsHandler, 
    fetchBlogCategoriesHandler, 
    fetchBlogCommentsHandler, 
    fetchBlogsHandler, 
    findChatHandler, 
    fetchChatMessagesHandler, 
    fetchNewslettersHandler, 
    fetchServicesHandler, 
    fetchSubscribersHandler, 
    fetchTestimonialsHandler, 
    getAllClientsHandler, 
    getDocsHandler, 
    getSingleAuthorHandler, 
    getSingleBlogCategoryHandler, 
    getSingleClientHandler, 
    getSingleNewsLetterHandler, 
    getSingleServiceHandler, 
    getSingleSubscriberHandler, 
    getSingleTestimonialHandler, 
    likeBlogHandler, 
    singleBlogAdminHandler, 
    singleBlogHandler, 
    toggleClientStatusHandler, 
    updateAuthorHandler, 
    updateBlogCategoryHandler, 
    updateBlogHandler, 
    updateDeDocsHandler, 
    updateNewsLetterHandler, 
    updateServiceHandler, 
    updateSubscriberHandler,
    updateTestimonialHandler
} from '../../routes/adminRoute';

const adminEndpoints: RouteEndpoint  = [
    {
        name: 'create service',
        method: 'post',
        path: '/create-service',
        handler: createServiceHandler
    },
    {
        name: 'update service',
        method: 'put',
        path: '/update-service/:serviceId',
        handler: updateServiceHandler
    },
    {
        name: 'fetch services',
        method: 'get',
        path: '/fetch-services',
        handler: fetchServicesHandler
    },
    {
        name: 'get service',
        method: 'get',
        path: '/get-service/:serviceId',
        handler: getSingleServiceHandler
    },
    {
        name: 'delete service',
        method: 'delete',
        path: '/delete-service/:serviceId',
        handler: deleteServiceHandler
    },
    {
        name: 'dashboard data',
        method: 'get',
        path: '/dashboard-data',
        handler: dashboardDataHandler
    },
    {
        name: 'create client',
        method: 'post',
        path: '/create-client',
        handler: createClientHandler
    },
    {
        name: 'toggle client status',
        method: 'put',
        path: '/toggle-client-status/:clientId',
        handler: toggleClientStatusHandler
    },
    {
        name: 'create blog category',
        method: 'post',
        path: '/create-blog-category',
        handler: createBlogCategoryHandler
    },
    {
        name: 'delete-blog-category',
        method: 'delete',
        path: '/delete-blog-category/:blogCatId',
        handler: deleteBlogCategoryHandler
    },
    {
        name: 'update-blog-category',
        method: 'put',
        path: '/update-blog-category/:blogCatId',
        handler: updateBlogCategoryHandler
    },
    {
        name: 'fetch-blog-categories',
        method: 'get',
        path: '/fetch-blog-categories',
        handler: fetchBlogCategoriesHandler
    },
    {
        name: 'get-single-blog-category',
        method: 'get',
        path: '/get-single-blog-category/:blogCatId',
        handler: getSingleBlogCategoryHandler
    },
    {
        name: 'create-blog',
        method: 'post',
        path: '/create-blog',
        handler: createBlogHandler
    },
    {
        name: 'update-blog',
        method: 'put',
        path: '/update-blog/:blogId',
        handler: updateBlogHandler
    },
    {
        name: 'comment-on-blog',
        method: 'put',
        path: '/comment-on-blog/:blogId',
        handler: commentOnBlogHandler
    },
    {
        name: 'delete-blog',
        method: 'delete',
        path: '/delete-blog/:blogId',
        handler: deleteBlogHandler
    },
    {
        name: 'fetch-blogs',
        method: 'get',
        path: '/fetch-blogs',
        handler: fetchBlogsHandler
    },
    {
        name: 'like-blog',
        method: 'put',
        path: '/like-blog/:blogId',
        handler: likeBlogHandler
    },
    {
        name: 'fetch-blog-comments',
        method: 'get',
        path: '/fetch-blog-comments/:blogId',
        handler: fetchBlogCommentsHandler
    },
    {
        name: 'change-blog-status',
        method: 'put',
        path: '/change-blog-status/:blogId',
        handler: changeBlogStatusHandler
    },
    {
        name: 'get-single-blog',
        method: 'get',
        path: '/get-single-blog/:blogId',
        handler: singleBlogHandler
    },
    {
        name: 'get-single-blog-admin',
        method: 'get',
        path: '/get-single-blog-admin/:blogId',
        handler: singleBlogAdminHandler
    },
    {
        name: 'get-single-author',
        method: 'get',
        path: '/get-single-author/:authorId',
        handler: getSingleAuthorHandler
    },
    {
        name: 'fetch-authors',
        method: 'get',
        path: '/fetch-authors',
        handler: fetchAuthorsHandler
    },
    {
        name: 'delete-author',
        method: 'delete',
        path: '/delete-author/:authorId',
        handler: deleteAuthorHandler
    },
    {
        name: 'create-author',
        method: 'post',
        path: '/create-author',
        handler: createAuthorHandler
    },
    {
        name: 'update-author',
        method: 'put',
        path: '/update-author/:authorId',
        handler: updateAuthorHandler
    },
    {
        name: 'get-single-newsletter',
        method: 'get',
        path: '/get-single-newsletter/:newsletterId',
        handler: getSingleNewsLetterHandler
    },
    {
        name: 'fetch-newsletters',
        method: 'get',
        path: '/fetch-newsletters',
        handler: fetchNewslettersHandler
    },
    {
        name: 'delete-newsletter',
        method: 'delete',
        path: '/delete-newsletter/:newsletterId',
        handler: deleteNewsletterHandler
    },
    {
        name: 'change-newsletter-status',
        method: 'put',
        path: '/change-newsletter-status/:newsletterId',
        handler: changeNewsLetterStatusHandler
    },
    {
        name: 'create-newsletter',
        method: 'post',
        path: '/create-newsletter',
        handler: createNewsLetterHandler
    },
    {
        name: 'update-newsletter',
        method: 'put',
        path: '/update-newsletter/:newsLetterId',
        handler: updateNewsLetterHandler
    },
    {
        name: 'create-dedocs',
        method: 'post',
        path: '/create-dedocs',
        handler: createDeDocsHandler
    },
    {
        name: 'update-dedocs',
        method: 'put',
        path: '/update-dedocs',
        handler: updateDeDocsHandler
    },
    {
        name: 'get-dedocs',
        method: 'get',
        path: '/get-dedocs',
        handler: getDocsHandler
    },
    {
        name: 'create-subscriber',
        method: 'post',
        path: '/create-subscriber',
        handler: createSubscriberHandler
    },
    {
        name: 'update-subscriber',
        method: 'put',
        path: '/update-subscriber/:subscriberId',
        handler: updateSubscriberHandler
    },
    {
        name: 'get-single-subscriber',
        method: 'get',
        path: '/get-single-subscriber/:subscriberId',
        handler: getSingleSubscriberHandler
    },
    {
        name: 'fetch-subscribers',
        method: 'get',
        path: '/fetch-subscribers',
        handler: fetchSubscribersHandler
    },
    {
        name: 'delete-subscriber',
        method: 'delete',
        path: '/delete-subscriber/:subscriberId',
        handler: deleteSubscriberHandler
    },
    {
        name: 'change-subscriber-status',
        method: 'put',
        path: '/change-subscriber-status/:subscriberId',
        handler: changeSubscriberStatusHandler
    },
    {
        name: 'create-testimonial',
        method: 'post',
        path: '/create-testimonial',
        handler: createTestimonialHandler
    },
    {
        name: 'update-testimonial',
        method: 'put',
        path: '/update-testimonial/:testimonialId',
        handler: updateTestimonialHandler
    },
    {
        name: 'get-single-testimonial',
        method: 'get',
        path: '/get-single-testimonial/:testimonialId',
        handler: getSingleTestimonialHandler
    },
    {
        name: 'fetch-testimonials',
        method: 'get',
        path: '/fetch-testimonials',
        handler: fetchTestimonialsHandler
    },
    {
        name: 'delete-testimonial',
        method: 'delete',
        path: '/delete-testimonial/:testimonialId',
        handler: deleteTestimonialHandler
    },
    {
        name: 'delete client',
        method: 'delete',
        path: '/delete-client/:clientId',
        handler: deleteClientHandler
    },
    {
        name: 'get client',
        method: 'get',
        path: '/get-single-client/:clientId',
        handler: getSingleClientHandler
    },
    {
        name: 'get all clients',
        method: 'get',
        path: '/get-all-clients',
        handler: getAllClientsHandler
    },
    {
        name: 'Contact us form',
        method: 'post',
        path: '/contact-us-form',
        handler: contactUsFormHandler
    },
    {
        name: 'create chat',
        method: 'post',
        path: '/create-chat',
        handler: createChatHandler
    },
    {
        name: 'find chat',
        method: 'post',
        path: '/find-chat',
        handler: findChatHandler
    },
    {
        name: 'fetch chat messages',
        method: 'post',
        path: '/fetch-chat-messages',
        handler: fetchChatMessagesHandler
    },
]

export default adminEndpoints;
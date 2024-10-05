import UserRepository from "../../repositories/UserRepository";
import ClientRepository from "../../repositories/ClientRepository";
import SignUpAtemptRepository from "../../repositories/SignUpAtemptRepository";
import ServicesRepository from "../../repositories/ServicesRepository";
import ApplicationRepository from "../../repositories/ApplicationRepository";
import TransactionRepository from "../../repositories/TransactionRepository";
import AppointmentRepository from "../../repositories/AppointmentRepository";
import AppointmentConfigRepository from "../../repositories/AppointmentConfigRepository";
import BlogCommentsRepository from "../../repositories/BlogCommentsRepository";
import BlogRepository from "../../repositories/BlogRepository";
import DeBizDocsRepository from "../../repositories/DeBizDocsRepository";
import NewsLetterRepository from "../../repositories/NewsLetterRepository";
import SubscriberRepository from "../../repositories/SubscriberRepository";
import TestimonialRepository from "../../repositories/TestimonialRepository";
import ChatMessageRepository from "../../repositories/ChatMessageRepository";
import ChatRepository from "../../repositories/ChatRepository";

import UserDAOService from "./UserDAOService";
import ClientDAOService from "./ClientDAOService";
import SignUpAtemptDAOService from "./SignUpAtemptDAOService";
import ServicesDAOService from "./ServicesDAOService";
import ApplicationDAOService from "./ApplicationDAOService";
import TransactionDAOService from "./TransactionDAOService";
import AppointmentDAOService from "./AppointmentDAOService";
import AppointmentConfigDAOService from "./AppointmentConfigDAOService";
import BlogCommentsDAOService from "./BlogCommentsDAOService";
import BlogDAOService from "./BlogDAOService";
import DeBizDocsDAOService from "./DeBizDocsDAOService";
import NewsLetterDAOService from "./NewsLetterDAOService";
import SubscriberDAOService from "./SubscriberDAOService";
import TestimonialDAOService from "./TestimonialDAOService";
import ChatMessageDAOService from "./ChatMessageDAOService";
import ChatDAOService from "./ChatDAOService";

const userRepository = new UserRepository();
const clientRepository= new ClientRepository();
const signUpAtemptRepository= new SignUpAtemptRepository();
const servicesRepository= new ServicesRepository();
const transactionRepository= new TransactionRepository();
const applicationRepository= new ApplicationRepository();
const appointmentRepository= new AppointmentRepository();
const appointmentConfigRepository= new AppointmentConfigRepository();
const blogCommentsRepository= new BlogCommentsRepository();
const blogRepository= new BlogRepository();
const deBizDocsRepository= new DeBizDocsRepository();
const newsLetterRepository= new NewsLetterRepository();
const subscriberRepository= new SubscriberRepository();
const testimonialRepository= new TestimonialRepository();
const chatMessageRepository = new ChatMessageRepository();
const chatRepository = new ChatRepository();

const userDAOService = new UserDAOService(userRepository);
const clientDAOService = new ClientDAOService(clientRepository);
const signUpAtemptDAOService = new SignUpAtemptDAOService(signUpAtemptRepository);
const servicesDAOService = new ServicesDAOService(servicesRepository);
const applicationDAOService = new ApplicationDAOService(applicationRepository);
const transactionDAOService = new TransactionDAOService(transactionRepository);
const appointmentDAOService = new AppointmentDAOService(appointmentRepository);
const appointmentConfigDAOService = new AppointmentConfigDAOService(appointmentConfigRepository);
const blogCommentsDAOService = new BlogCommentsDAOService(blogCommentsRepository);
const blogDAOService = new BlogDAOService(blogRepository);
const deBizDocsDAOService = new DeBizDocsDAOService(deBizDocsRepository);
const newsLetterDAOService = new NewsLetterDAOService(newsLetterRepository);
const subscriberDAOService = new SubscriberDAOService(subscriberRepository);
const testimonialDAOService = new TestimonialDAOService(testimonialRepository);
const chatMessageDAOService = new ChatMessageDAOService(chatMessageRepository);
const chatDAOService = new ChatDAOService(chatRepository);

export default {
    userDAOService,
    chatMessageDAOService,
    appointmentConfigDAOService,
    chatDAOService,
    applicationDAOService,
    transactionDAOService,
    signUpAtemptDAOService,
    clientDAOService,
    servicesDAOService,
    appointmentDAOService,
    blogCommentsDAOService,
    blogDAOService,
    deBizDocsDAOService,
    newsLetterDAOService,
    subscriberDAOService,
    testimonialDAOService
}
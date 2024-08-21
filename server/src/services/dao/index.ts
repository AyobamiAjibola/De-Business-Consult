import UserRepository from "../../repositories/UserRepository";
import ClientRepository from "../../repositories/ClientRepository";
import SignUpAtemptRepository from "../../repositories/SignUpAtemptRepository";
import ServicesRepository from "../../repositories/ServicesRepository";
import ApplicationRepository from "../../repositories/ApplicationRepository";
import TransactionRepository from "../../repositories/TransactionRepository";
import AppointmentRepository from "../../repositories/AppointmentRepository";

import UserDAOService from "./UserDAOService";
import ClientDAOService from "./ClientDAOService";
import SignUpAtemptDAOService from "./SignUpAtemptDAOService";
import ServicesDAOService from "./ServicesDAOService";
import ApplicationDAOService from "./ApplicationDAOService";
import TransactionDAOService from "./TransactionDAOService";
import AppointmentDAOService from "./AppointmentDAOService";

const userRepository = new UserRepository();
const clientRepository= new ClientRepository();
const signUpAtemptRepository= new SignUpAtemptRepository();
const servicesRepository= new ServicesRepository();
const transactionRepository= new TransactionRepository();
const applicationRepository= new ApplicationRepository();
const appointmentRepository= new AppointmentRepository();

const userDAOService = new UserDAOService(userRepository);
const clientDAOService = new ClientDAOService(clientRepository);
const signUpAtemptDAOService = new SignUpAtemptDAOService(signUpAtemptRepository);
const servicesDAOService = new ServicesDAOService(servicesRepository);
const applicationDAOService = new ApplicationDAOService(applicationRepository);
const transactionDAOService = new TransactionDAOService(transactionRepository);
const appointmentDAOService = new AppointmentDAOService(appointmentRepository);

export default {
    userDAOService,
    applicationDAOService,
    transactionDAOService,
    signUpAtemptDAOService,
    clientDAOService,
    servicesDAOService,
    appointmentDAOService
}
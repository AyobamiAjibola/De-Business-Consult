import UserRepository from "../../repositories/UserRepository";
import ClientRepository from "../../repositories/ClientRepository";
import SignUpAtemptRepository from "../../repositories/SignUpAtemptRepository";
import ServicesRepository from "../../repositories/ServicesRepository";

import UserDAOService from "./UserDAOService";
import ClientDAOService from "./ClientDAOService";
import SignUpAtemptDAOService from "./SignUpAtemptDAOService";
import ServicesDAOService from "./ServicesDAOService";

const userRepository = new UserRepository();
const clientRepository= new ClientRepository();
const signUpAtemptRepository= new SignUpAtemptRepository();
const servicesRepository= new ServicesRepository();

const userDAOService = new UserDAOService(userRepository);
const clientDAOService = new ClientDAOService(clientRepository);
const signUpAtemptDAOService = new SignUpAtemptDAOService(signUpAtemptRepository);
const servicesDAOService = new ServicesDAOService(servicesRepository);

export default {
    userDAOService,
    signUpAtemptDAOService,
    clientDAOService,
    servicesDAOService
}
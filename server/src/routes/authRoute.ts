import AuthenticationController from "../controller/AuthenticationController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";
import PasswordEncoder from "../utils/PasswordEncoder";

const passwordEncoder = new PasswordEncoder();
const authController = new AuthenticationController(passwordEncoder);

export const createUserHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.createUser(req);

    res.status(response.code).json(response);
});

export const updateUserStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.updateUserStatus(req);
    
    res.status(response.code).json(response);
});

export const fetchUsersHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.fetchUsers(req);

    res.status(response.code).json(response);
});

export const getSingleUsersHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.getSingleUser(req);

    res.status(response.code).json(response);
});

export const getAccessTokenHandler = async (req: Request, res: Response) =>  {
    const response = await authController.getAccessToken(req);

    res.status(response.code).json(response);
};

export const preSignUpHandler = async (req: Request, res: Response) =>  {
    const response = await authController.preSignUp(req);
    res.status(response.code).json(response);
};

export const validateSignUpLinkHandler = async (req: Request, res: Response) =>  {
    const response = await authController.validateSignUpLink(req);
    res.status(response.code).json(response);
};

export const clientSignUpHandler = async (req: Request, res: Response) =>  {
    const response = await authController.clientSignUp(req);
    res.status(response.code).json(response);
};

export const loggingHandler = async (req: Request, res: Response) =>  {
    const response = await authController.logging(req);
    res.status(response.code).json(response);
};

export const adminLoggingHandler = async (req: Request, res: Response) =>  {
    const response = await authController.adminLogging(req);
    res.status(response.code).json(response);
};

export const resetPasswordHandler = async (req: Request, res: Response) =>  {
    const response = await authController.resetPassword(req);
    res.status(response.code).json(response);
};

export const resetAdminPasswordHandler = async (req: Request, res: Response) =>  {
    const response = await authController.resetAdminPassword(req);
    res.status(response.code).json(response);
};

export const validateResetPasswordOtpHandler = async (req: Request, res: Response) =>  {
    const response = await authController.validateResetPasswordOtp(req);
    res.status(response.code).json(response);
};

export const validateResetAdminPasswordOtpHandler = async (req: Request, res: Response) =>  {
    const response = await authController.validateResetAdminPasswordOtp(req);
    res.status(response.code).json(response);
};

export const changeResetPasswordHandler = async (req: Request, res: Response) =>  {
    const response = await authController.changeResetPassword(req);
    res.status(response.code).json(response);
};

export const changeResetPasswordAdminHandler = async (req: Request, res: Response) =>  {
    const response = await authController.changeResetPasswordAdmin(req);
    res.status(response.code).json(response);
};

export const changePasswordHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.changePassword(req);

    res.status(response.code).json(response);
});

export const changePasswordAdminHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.changePasswordAdmin(req);

    res.status(response.code).json(response);
});

export const notificationSettingsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.notificationSettings(req);

    res.status(response.code).json(response);
});

export const updateProfileHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.updateProfile(req);

    res.status(response.code).json(response);
});

export const updateProfileAdminHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await authController.updateProfileAdmin(req);

    res.status(response.code).json(response);
});
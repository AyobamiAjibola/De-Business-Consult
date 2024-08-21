import AdminController from "../controller/AdminController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";

const adminController = new AdminController();

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
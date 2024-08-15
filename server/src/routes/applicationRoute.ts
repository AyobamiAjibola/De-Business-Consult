import ApplicationController from "../controller/ApplicationController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";

const applicationController = new ApplicationController();

export const feeCalculatorV1Handler = async (req: Request, res: Response) =>  {
    const response = await applicationController.feeCalculatorV1(req);

    res.status(response.code).json(response);
};

export const fetchClientApplicationsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.fetchClientApplications(req);

    res.status(response.code).json(response);
});

export const fetchAllApplicationsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.fetchAllApplications(req);

    res.status(response.code).json(response);
});

export const changeApplicationsStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.changeApplicationsStatus(req);

    res.status(response.code).json(response);
});

export const downloadApplicationDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.downloadApplicationDocs(req, res);

    res.status(response.code).json(response);
});

export const createApplicationHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.createApplication(req);

    res.status(response.code).json(response);
});

export const uploadSuccessfulDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.uploadSuccessfulDocs(req);

    res.status(response.code).json(response);
});
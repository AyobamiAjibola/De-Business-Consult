import ApplicationController from "../controller/ApplicationController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";

const applicationController = new ApplicationController();

export const paymentCheckoutHandler = async (req: Request, res: Response) =>  {
    const response = await applicationController.paymentCheckout(req);

    res.status(response.code).json(response);
};

export const paymentIntentHandler =  async (req: Request, res: Response) =>  {
    const response = await applicationController.paymentIntent(req);

    res.status(response.code).json(response);
};

export const webhookHandler = async (req: Request, res: Response) =>  {
    const response = await applicationController.webhook(req);

    res.status(response.code).json(response);
};

export const feeCalculatorV1Handler = async (req: Request, res: Response) =>  {
    const response = await applicationController.feeCalculatorV1(req);

    res.status(response.code).json(response);
};

export const fetchTransactionsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.fetchTransactions(req);

    res.status(response.code).json(response);
});

export const getSingleTransactionHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.getSingleTransaction(req);

    res.status(response.code).json(response);
});

export const deleteTransactionHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.deleteTransaction(req);

    res.status(response.code).json(response);
});

export const fetchClientApplicationsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.fetchClientApplications(req);

    res.status(response.code).json(response);
});

export const getSingleApplicationHandler = async  (req: Request, res: Response) =>  {
    const response = await applicationController.getSingleApplication(req);

    res.status(response.code).json(response);
};

export const fetchAllApplicationsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.fetchAllApplications(req);

    res.status(response.code).json(response);
});

export const changeApplicationsStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.changeApplicationsStatus(req);

    res.status(response.code).json(response);
});

// export const downloadApplicationDocsHandler = async (req: Request, res: Response) =>  {
//     const response = await applicationController.downloadApplicationDocs(req, res);

//     res.status(200).json(response);
// };

export const createApplicationHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.createApplication(req);

    res.status(response.code).json(response);
});

export const uploadSuccessfulDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.uploadSuccessfulDocs(req);

    res.status(response.code).json(response);
});

export const uploadReviewDocsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await applicationController.uploadReviewDocs(req);

    res.status(response.code).json(response);
});
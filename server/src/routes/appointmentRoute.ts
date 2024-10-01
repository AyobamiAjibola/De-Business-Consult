import AppointmentController from "../controller/AppointmentController";
import authenticateRouteWrapper from "../middleware/authenticateRouteWrapper";
import { Request, Response } from "express";

const appointmentController = new AppointmentController();


export const createAppointmentHandler = async (req: Request, res: Response) =>  {
    const response = await appointmentController.createAppointment(req);

    res.status(response.code).json(response);
};

export const changeAppointmentStatusHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await appointmentController.changeAppointmentStatus(req);

    res.status(response.code).json(response);
});

export const fetchAllAppointmentsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await appointmentController.fetchAllAppointments(req);

    res.status(response.code).json(response);
});

export const fetchClientAppointmentsHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await appointmentController.fetchClientAppointments(req);

    res.status(response.code).json(response);
});

export const updateAppointmentHandler = authenticateRouteWrapper(async (req, res) =>  {
    const response = await appointmentController.updateAppointment(req);

    res.status(response.code).json(response);
});
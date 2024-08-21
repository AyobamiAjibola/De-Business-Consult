import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    changeAppointmentStatusHandler, 
    createAppointmentHandler, 
    fetchAllAppointmentsHandler, 
    fetchClientAppointmentsHandler, 
    updateAppointmentHandler 
} from '../../routes/appointmentRoute';

const appointmentEndpoints: RouteEndpoint  = [
    {
        name: 'create appointment',
        method: 'post',
        path: '/create-appointment',
        handler: createAppointmentHandler
    },
    {
        name: 'change appointment status',
        method: 'put',
        path: '/change-appointment-status/:appointmentId',
        handler: changeAppointmentStatusHandler
    },
    {
        name: 'fetch all appointments',
        method: 'get',
        path: '/fetch-all-appointments',
        handler: fetchAllAppointmentsHandler
    },
    {
        name: 'fetch client appointments',
        method: 'get',
        path: '/fetch-client-appointments/:clientId',
        handler: fetchClientAppointmentsHandler
    },
    {
        name: 'update client appointment',
        method: 'put',
        path: '/update-client-appointment/:appointmentId',
        handler: updateAppointmentHandler
    },
]

export default appointmentEndpoints;
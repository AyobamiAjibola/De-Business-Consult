import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    changeAppointmentStatusHandler, 
    createAppointmentConfigHandler, 
    createAppointmentHandler, 
    deleteAppointmentConfigHandler, 
    fetchAllAppointmentsHandler, 
    fetchClientAppointmentsHandler, 
    getAppointmentConfigHandler, 
    updateAppointmentHandler 
} from '../../routes/appointmentRoute';

const appointmentEndpoints: RouteEndpoint  = [
    {
        name: 'create appointment config',
        method: 'post',
        path: '/create-appointment-config',
        handler: createAppointmentConfigHandler
    },
    {
        name: 'delete appointment config',
        method: 'delete',
        path: '/delete-appointment-config/:serviceConfigId',
        handler: deleteAppointmentConfigHandler
    },
    {
        name: 'fetch appointment config',
        method: 'get',
        path: '/get-appointment-config',
        handler: getAppointmentConfigHandler
    },
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
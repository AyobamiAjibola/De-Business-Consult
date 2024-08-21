import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    createClientHandler,
    createServiceHandler, 
    dashboardDataHandler, 
    deleteServiceHandler, 
    fetchServicesHandler, 
    getSingleServiceHandler, 
    toggleClientStatusHandler, 
    updateServiceHandler 
} from '../../routes/adminRoute';

const adminEndpoints: RouteEndpoint  = [
    {
        name: 'create service',
        method: 'post',
        path: '/create-service',
        handler: createServiceHandler
    },
    {
        name: 'update service',
        method: 'put',
        path: '/update-service/:serviceId',
        handler: updateServiceHandler
    },
    {
        name: 'fetch services',
        method: 'get',
        path: '/fetch-services',
        handler: fetchServicesHandler
    },
    {
        name: 'get service',
        method: 'get',
        path: '/get-service/:serviceId',
        handler: getSingleServiceHandler
    },
    {
        name: 'delete service',
        method: 'delete',
        path: '/delete-service/:serviceId',
        handler: deleteServiceHandler
    },
    {
        name: 'dashboard data',
        method: 'get',
        path: '/dashboard-data',
        handler: dashboardDataHandler
    },
    {
        name: 'create client',
        method: 'post',
        path: '/create-client',
        handler: createClientHandler
    },
    {
        name: 'toggle client status',
        method: 'put',
        path: '/toggle-client-status/:clientId',
        handler: toggleClientStatusHandler
    },
]

export default adminEndpoints;
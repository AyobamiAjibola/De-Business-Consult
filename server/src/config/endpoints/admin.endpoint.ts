import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    createServiceHandler, 
    deleteServiceHandler, 
    fetchServicesHandler, 
    getSingleServiceHandler, 
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
]

export default adminEndpoints;
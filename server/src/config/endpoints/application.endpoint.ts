import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    changeApplicationsStatusHandler,
    createApplicationHandler,
    deleteTransactionHandler,
    downloadApplicationDocsHandler,
    feeCalculatorV1Handler, 
    fetchAllApplicationsHandler, 
    fetchClientApplicationsHandler, 
    fetchTransactionsHandler, 
    getSingleTransactionHandler, 
    paymentCheckoutHandler, 
    paymentIntentHandler, 
    uploadSuccessfulDocsHandler
} from '../../routes/applicationRoute';

const applicationEndpoints: RouteEndpoint  = [
    {
        name: 'payment checkout',
        method: 'post',
        path: '/payment-checkout',
        handler: paymentCheckoutHandler
    },
    {
        name: 'payment intent',
        method: 'post',
        path: '/payment-intent',
        handler: paymentIntentHandler
    },
    {
        name: 'fee calculator V1',
        method: 'post',
        path: '/fee-calculator-v1',
        handler: feeCalculatorV1Handler
    },
    {
        name: 'fetch transactions',
        method: 'get',
        path: '/fetch-transactions',
        handler: fetchTransactionsHandler
    },
    {
        name: 'get single transaction',
        method: 'get',
        path: '/get-single-transaction/:transactionId',
        handler: getSingleTransactionHandler
    },
    {
        name: 'delete transaction',
        method: 'delete',
        path: '/delete-transaction/:transactionId',
        handler: deleteTransactionHandler
    },
    {
        name: 'fetch client applications',
        method: 'get',
        path: '/fetch-client-applications/:clientId',
        handler: fetchClientApplicationsHandler
    },
    {
        name: 'fetch applications',
        method: 'get',
        path: '/fetch-applications',
        handler: fetchAllApplicationsHandler
    },
    {
        name: 'change applications status',
        method: 'post',
        path: '/change-applications-status/:applicationId',
        handler: changeApplicationsStatusHandler
    },
    {
        name: 'download application docs',
        method: 'get',
        path: '/download-application-docs/:applicationId',
        handler: downloadApplicationDocsHandler
    },
    {
        name: 'create application',
        method: 'post',
        path: '/create-application',
        handler: createApplicationHandler
    },
    {
        name: 'upload application docs',
        method: 'put',
        path: '/upload-application-docs/:applicationId',
        handler: uploadSuccessfulDocsHandler
    },
]

export default applicationEndpoints;
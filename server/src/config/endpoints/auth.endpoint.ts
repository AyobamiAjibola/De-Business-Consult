import { appCommonTypes } from '../../@types/app-common';
import RouteEndpoint = appCommonTypes.RouteEndpoints;
import { 
    adminLoggingHandler, 
    changePasswordAdminHandler, 
    changePasswordHandler, 
    changeResetPasswordAdminHandler, 
    changeResetPasswordHandler, 
    clientSignUpHandler, 
    createUserHandler, 
    fetchUsersHandler, 
    getAccessTokenHandler, 
    loggingHandler, 
    notificationSettingsHandler, 
    preSignUpHandler, 
    resetAdminPasswordHandler, 
    resetPasswordHandler, 
    updateProfileAdminHandler, 
    updateProfileHandler, 
    updateUserStatusHandler, 
    validateResetAdminPasswordOtpHandler, 
    validateResetPasswordOtpHandler, 
    validateSignUpLinkHandler 
} from '../../routes/authRoute';

const authEndpoints: RouteEndpoint  = [
    {
        name: 'create user',
        method: 'post',
        path: '/create-user',
        handler: createUserHandler
    },
    {
        name: 'update user status',
        method: 'put',
        path: '/update-user-status/:id',
        handler: updateUserStatusHandler
    },
    {
        name: 'fetch users',
        method: 'get',
        path: '/fetch-users',
        handler: fetchUsersHandler
    },
    {
        name: 'get access token',
        method: 'post',
        path: '/get-access-token',
        handler: getAccessTokenHandler
    },
    {
        name: 'pre signup',
        method: 'post',
        path: '/pre-signup',
        handler: preSignUpHandler
    },
    {
        name: 'validate signup link',
        method: 'post',
        path: '/validate-signup-link/:id',
        handler: validateSignUpLinkHandler
    },
    {
        name: 'signup',
        method: 'post',
        path: '/signup/:id',
        handler: clientSignUpHandler
    },
    {
        name: 'logging',
        method: 'post',
        path: '/signin',
        handler: loggingHandler
    },
    {
        name: 'sign in',
        method: 'post',
        path: '/admin-sign-in',
        handler: adminLoggingHandler
    },
    {
        name: 'reset password',
        method: 'post',
        path: '/reset-password',
        handler: resetPasswordHandler
    },
    {
        name: 'validate reset password otp',
        method: 'post',
        path: '/validate-reset-password-otp',
        handler: validateResetPasswordOtpHandler
    },
    {
        name: 'change reset password',
        method: 'post',
        path: '/change-reset-password',
        handler: changeResetPasswordHandler
    },
    {
        name: 'change password',
        method: 'post',
        path: '/change-password',
        handler: changePasswordHandler
    },
    {
        name: 'reset password admin',
        method: 'post',
        path: '/reset-password-admin',
        handler: resetAdminPasswordHandler
    },
    {
        name: 'validate reset password otp admin',
        method: 'post',
        path: '/validate-reset-password-otp-admin',
        handler: validateResetAdminPasswordOtpHandler
    },
    {
        name: 'change reset password admin',
        method: 'post',
        path: '/change-reset-password-admin',
        handler: changeResetPasswordAdminHandler
    },
    {
        name: 'change password admin',
        method: 'post',
        path: '/change-password-admin',
        handler: changePasswordAdminHandler
    },
    {
        name: 'notification settings',
        method: 'put',
        path: '/notification-settings',
        handler: notificationSettingsHandler
    },
    {
        name: 'update client profile',
        method: 'put',
        path: '/update-client-profile',
        handler: updateProfileHandler
    },
    {
        name: 'update client profile admin',
        method: 'put',
        path: '/update-client-profile-admin',
        handler: updateProfileAdminHandler
    }
]

export default authEndpoints;
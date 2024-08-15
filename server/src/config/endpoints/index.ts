import authEndpoints from "./auth.endpoint";
import applicationEndpoints from "./application.endpoint";
import adminEndpoints from "./admin.endpoint";

const endpoints = authEndpoints
.concat(applicationEndpoints)
.concat(adminEndpoints)

export default endpoints;
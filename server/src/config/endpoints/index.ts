import authEndpoints from "./auth.endpoint";
import applicationEndpoints from "./application.endpoint";
import adminEndpoints from "./admin.endpoint";
import appointmentEndpoints from "./appointment.endpoint";

const endpoints = authEndpoints
.concat(applicationEndpoints)
.concat(adminEndpoints)
.concat(appointmentEndpoints)

export default endpoints;
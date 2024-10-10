import { appCommonTypes } from '../../../@types/app-common';
import MailTextConfig = appCommonTypes.MailTextConfig;

export default function appointment_schedule_template({day, time, appointmentId}: any) {
    return `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            overflow: auto;
        }

        .wrapper {
            background-color: #F5F5F5;
            width: 80%;
            margin-bottom: 70px;
            /* height: 100vh; */
            padding-bottom: 60px;
            padding-top: 30px;
        }

        .message {
            font-size: 40px;
            font-weight: 900;
        }

        .subtext {
            font-size: 16px;
            font-weight: 500;
            padding-left: 10px;
            padding-right: 10px;
        }

        .subtext2 {
            font-size: 14px;
            padding-left: 2px;
        }

        @media(max-width:700px) {

            .wrapper {
                width: 90% !important;
                padding-top: 50px !important;
            }

        }
    </style>
</head>

<body>
    <center class="wrapper">
        <p class="subtext">Your appointment (${appointmentId}) is ${day > 0 ? 'tomorrow' : 'today'} at ${time}</p>
        <p class="subtext2">Thank you. Please be punctual.</p>
    </center>

</body>

</html>
    `;
}

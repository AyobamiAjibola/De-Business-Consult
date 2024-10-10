import { appCommonTypes } from '../../../@types/app-common';
import MailTextConfig = appCommonTypes.MailTextConfig;

export default function appointment_template({date, time, services, appointmentId}: any) {
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

        .appointmentdetails {
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
        }

        .subtext {
            font-size: 16px;
            font-weight: 500;
            padding-left: 10px;
            padding-right: 10px;
            text-align: center;
        }

        .subtext2 {
            font-size: 14px;
            padding-left: 2px;
            text-align: center;
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
    <div class="wrapper">
        <p class="subtext" style="margin-bottom: 30px;">Your appointment as been scheduled for:</p>
            <div
                style="
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    margin-left: 20px;
                "
            >
                <span style="font-weight: 700; font-size: 16px;">
                    Appointment Id:
                </span>
                <span style="font-size: 16px; margin-left: 6px;">
                    ${appointmentId} 
                </span>
            </div>
            <div
                style="
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    margin-left: 20px;
                "
            >
                <span style="font-weight: 700; font-size: 16px;">
                    Appointment Date:
                </span>
                <span style="font-size: 16px; margin-left: 6px;">
                    ${date} 
                </span>
            </div>
            <div
                style="
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    margin-left: 20px;
                "
            >
                <span style="font-weight: 700; font-size: 16px;">
                    Appointment Time:
                </span>
                <span style="font-size: 16px; margin-left: 6px;">
                    ${time} 
                </span>
            </div>
            <div
                style="
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    margin-left: 20px;
                "
            >
                <span style="font-weight: 700; font-size: 16px;">
                    Services to be reviewed:
                </span>
                <span style="font-size: 16px; margin-left: 6px;">
                    ${services} 
                </span>
            </div>

        <p class="subtext2" style="margin-top: 30px;">Thank you. Please be punctual on the appointment day.</p>
    </div>

</body>

</html>
    `;
}

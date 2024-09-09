import { appCommonTypes } from '../../../@types/app-common';
import MailTextConfig = appCommonTypes.MailTextConfig;

export default function contact_us_template(config: MailTextConfig) {
    const content = config.content;

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
            background-color: #fff;
            width: 100%;
            /* height: 100vh; */
            padding-bottom: 60px;
            padding-top: 30px;
            padding-left: 20px;
            padding-right: 20px;
        }

        .message {
            font-size: 40px;
            font-weight: 900;
        }

        .subtext {
            font-size: 14px;
            font-weight: 600;
        }

        .message {
            font-size: 16px;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <span class="subtext">${config.fullName}</span> <br>
        <span class="subtext">${config.email}</span> <br>
        <span class="subtext" >${config.phone}</span> <br><br>
        <span class="subtext">
            ${config.message}
        </span>
    </div>
</body>

</html>
    `;
}

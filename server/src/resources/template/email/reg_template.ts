import { appCommonTypes } from '../../../@types/app-common';
import MailTextConfig = appCommonTypes.MailTextConfig;

export default function reg_template({header, sub, body, footer, subFooter}: any) {
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
            padding-left: 10px;
            padding-right: 10px;
            text-align: center;
        }

        .subtext2 {
            font-size: 14px;
            padding-left: 2px;
            text-align: center;
            margin-bottom: -10px;
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
        <h2 class="subtext" style="text-decoration: underline;">${header}</h2>
        <p style="
            font-size: 14px;
            text-align: center;
            margin-bottom: 15px;
        ">
            ${sub}
        </p>
        <p style="
            font-size: 14px;
            text-align: center;
            margin-bottom: 30px;
        ">
            ${body}
        </p>
        <p class="subtext2" style="margin-bottom: -10px;">${footer}</p>
        <p class="subtext2"><a href="${subFooter}" style="cursor: pointer;">${subFooter}</a></p>
    </div>

</body>

</html>
    `;
}

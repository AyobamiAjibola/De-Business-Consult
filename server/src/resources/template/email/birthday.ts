export default function birthday_template({name}: any) {
    return `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Birthday Email</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            overflow: auto;
        }

        .wrapper {
            background-color: #fff;
            width: 80%;
            margin-bottom: 70px;
            padding-bottom: 60px;
            padding-top: 30px;
        }

        .subtext {
            font-size: 14px;
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
        <img
            style="
                margin-bottom:  20px;
                width: 100%;
                height: 400px;
            "
            src="/public/birthday.jpg"
        />
        <div
            style="
                display: flex;
                gap: 6px;
                align-items: center;
                margin-left: 20px;
                margin-bottom:  30px;
            "
        >
            <span style="font-size: 14px; margin-left: 6px;">
                Hi ${name}!
            </span>
        </div>
        <div
            style="
                display: flex;
                gap: 6px;
                align-items: center;
                margin-left: 20px;
                margin-bottom:  30px;
            "
        >
            <span style="font-size: 14px; margin-left: 6px;">
                Happy Birthday from all of us at De Business Consult! 🎉🎂 On this special day, we want to take a moment to celebrate YOU! 🎈
            </span>
        </div>
        <div
            style="
                display: flex;
                gap: 6px;
                align-items: center;
                margin-left: 20px;
                margin-bottom:  30px;
            "
        >
            <span style="font-size: 14px; margin-left: 6px;">
                May your day be filled with joy, laughter, and all the wonderful things you deserve. Your presence brightens our community, and we're grateful to have you as part of our journey. Cheers to another fantastic year ahead! 🥳🎂 #CheersToYou 🎁🎊 
            </span>
        </div>
        <div
            style="
                display: flex;
                gap: 6px;
                align-items: center;
                margin-left: 20px;
                margin-bottom:  30px;
            "
        >
            
            <span style="font-size: 14px; margin-left: 6px;">
                All the love,
            </span>
        </div>

    </div>

</body>

</html>
    `;
}

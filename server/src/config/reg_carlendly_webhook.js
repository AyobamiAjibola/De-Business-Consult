import axios from 'axios';

const { 
  WEBHOOK_SUB_URL,
  CALENDLY_URL_DEV,
  CALENDLY_ORG_ID,
  CALENDLY_API_KEY
} = process.env

// axios.post(`${WEBHOOK_SUB_URL}`, {
//     url: `${CALENDLY_URL_DEV}`,
//     events: [
//       "invitee.created",
//       "invitee.canceled",
//       "invitee_no_show.created",
//       "invitee_no_show.deleted"
//     ],
//     organization: `https://api.calendly.com/organizations/${CALENDLY_ORG_ID}`
//   }, {
//     headers: {
//       'Authorization': `Bearer ${CALENDLY_API_KEY}`,
//       'Content-Type': 'application/json'
//     }
//   })
//   .then(response => {
//     console.log('Webhook registered:', response.data);
//   })
//   .catch(error => {
//     console.error('Error registering webhook:', error);
//   });


  // var options = {
  //   method: 'POST',
  //   url: 'https://api.calendly.com/webhook_subscriptions',
  //   headers: {'Content-Type': 'application/json', Authorization: `Bearer eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzMxNTg5ODU4LCJqdGkiOiI5Yzg2NWRjOS00MjkyLTQ5YzQtOGNjMy1hMTQ5NjJjNTg2ZGUiLCJ1c2VyX3V1aWQiOiI5ODRkNzFmOS00NjA0LTQxZDAtODg3MC04NmI3ZjgwZWQ0MDciLCJhcHBfdWlkIjoiWU5kZ3NjY09aSzBpYm1lWUN4R3ppRzcxSDdxbmw0LXhSVFlkUmR4SEhjSSIsImV4cCI6MTczMTU5NzA1OH0.44Yqbrn_Yg69QNL4moI_QCWOwl07buDbAw4fGBlSz-rTJJzDmR9cH0FCFMMY_NQL02wh6tvbsAiEXMzBOOcuzA`,},
  //   data: {
  //     url: `https://adapted-tahr-moderately.ngrok-free.app/api/v1/webhooks/calendly`,
  //     events: [
  //       'invitee.created',
  //       'invitee.canceled',
  //       'invitee_no_show.created',
  //       'invitee_no_show.deleted'
  //     ],
  //     organization: `https://api.calendly.com/organizations/e73f6e2e-996a-4f8b-b79e-2f725b68d879`,
  //     // user: 'https://api.calendly.com/users/BBBBBBBBBBBBBBBB',
  //     scope: 'organization',
  //     //signing_key: '5mEzn9C-I28UtwOjZJtFoob0sAAFZ95GbZkqj4y3i0I'
  //   }
  // };
  
  // axios.request(options).then(function (response) {
  //   console.log('Webhook registered:', response.data);
  // }).catch(function (error) {
  //   console.error('Error registering webhook:', error.response?.data || error.message);
  // });


    // axios.get('https://api.calendly.com/users/me', {
    //   headers: {
    //     'Authorization': `Bearer eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzMxNTg5ODU4LCJqdGkiOiI5Yzg2NWRjOS00MjkyLTQ5YzQtOGNjMy1hMTQ5NjJjNTg2ZGUiLCJ1c2VyX3V1aWQiOiI5ODRkNzFmOS00NjA0LTQxZDAtODg3MC04NmI3ZjgwZWQ0MDciLCJhcHBfdWlkIjoiWU5kZ3NjY09aSzBpYm1lWUN4R3ppRzcxSDdxbmw0LXhSVFlkUmR4SEhjSSIsImV4cCI6MTczMTU5NzA1OH0.44Yqbrn_Yg69QNL4moI_QCWOwl07buDbAw4fGBlSz-rTJJzDmR9cH0FCFMMY_NQL02wh6tvbsAiEXMzBOOcuzA`,
    //     'Content-Type': 'application/json'
    //   }
    // })
    // .then(response => {
    //   console.log('Organization Info:', response.data);
    // })
    // .catch(error => {
    //   console.error('Error fetching organization info:', error);
    // });

    // axios.get('https://api.calendly.com/webhook_subscriptions', {
    //   headers: {
    //     'Authorization': `Bearer eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzMxNTg5ODU4LCJqdGkiOiI5Yzg2NWRjOS00MjkyLTQ5YzQtOGNjMy1hMTQ5NjJjNTg2ZGUiLCJ1c2VyX3V1aWQiOiI5ODRkNzFmOS00NjA0LTQxZDAtODg3MC04NmI3ZjgwZWQ0MDciLCJhcHBfdWlkIjoiWU5kZ3NjY09aSzBpYm1lWUN4R3ppRzcxSDdxbmw0LXhSVFlkUmR4SEhjSSIsImV4cCI6MTczMTU5NzA1OH0.44Yqbrn_Yg69QNL4moI_QCWOwl07buDbAw4fGBlSz-rTJJzDmR9cH0FCFMMY_NQL02wh6tvbsAiEXMzBOOcuzA`,
    //   }
    // })
    // .then(response => {
    //   console.log('Organization Info:', response.data);
    // })
    // .catch(error => {
    //   console.error('Error fetching organization info:', error);
    // });
  
  
  // if (require.main === module) {
  //   const task = process.argv[2];
  
  //   switch (task) {
  //     case 'registerWebhook':
  //       registerCalendlyWebhook();
  //       break;
  //     case 'fetchOrgInfo':
  //       fetchOrganizationInfo();
  //       break;
  //     default:
  //       console.log('Please provide a valid task: registerWebhook or fetchOrgInfo');
  //       break;
  //   }
  // }
  
  // export { registerCalendlyWebhook, fetchOrganizationInfo };
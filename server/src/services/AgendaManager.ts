import moment from 'moment';

import { AppAgenda } from 'agenda-schedule-wrapper';

import { BOOK_APPOINTMENT, CANCEL_APPOINTMENT } from '../config/constants';
import EventEmitter from 'events';

export default function agendaManager() {
//   emitter.on(BOOK_APPOINTMENT, ({ appointment }) => {
    // let startTime = appointment.timeSlot.split('-')[0].trim();
    // startTime = moment(startTime, 'HH: a');
    // const date = moment(appointment.appointmentDate);

    // const when = moment({
    //   year: date.year(),
    //   month: date.month(),
    //   date: date.date(),
    //   hours: startTime.hours(),
    // })
    //   .utc(true)
    //   .toDate();
    const appointment = {message:'Tada!'}

    const when = new Date();

    (async () => {
        //@ts-ignore
        await AppAgenda.dispatch({
            name: BOOK_APPOINTMENT,
            onTick: async (job: any) => {
            console.log(job.attrs);
            },
        });

        await AppAgenda.agenda.schedule(when, BOOK_APPOINTMENT, appointment);
    })();
//   });

//   emitter.on(RESCHEDULE_APPOINTMENT, ({ appointment }) => {
//     const { code } = appointment;

//     console.log('Rescheduled', code);
//   });

//   emitter.on(CANCEL_APPOINTMENT, ({ appointment }) => {
//     const { code } = appointment;

//     console.log('Cancelled', code);
//   });
}




// import moment from 'moment';
// import { AppAgenda } from 'agenda-schedule-wrapper';
// import { BOOK_APPOINTMENT, CANCEL_APPOINTMENT } from '../config/constants';
// import EventEmitter from 'events';

// export default function agendaManager(emitter: EventEmitter) {
//   const scheduleMessage = async (time: any, payload: any, message: any) => {
//     const when = moment(time, 'h:mm A').utc(true).toDate();

//     await AppAgenda.dispatch({
//       name: `${message}_NOTIFICATION`,
//       onTick: async job => {
//         console.log(`Sending ${message} notification to ${payload.email}`);
//         // Here, you would add your email sending logic
//       },
//     });

//     await AppAgenda.agenda.schedule(when, `${message}_NOTIFICATION`, payload);
//   };

//   emitter.on(BOOK_APPOINTMENT, ({ appointment }) => {
//     const { email, phone, appointmentTime, preAppointment1, preAppointment2 } = appointment;

//     // Schedule the pre-appointment notifications
//     scheduleMessage(preAppointment1, appointment, '15_MIN_BEFORE');
//     scheduleMessage(preAppointment2, appointment, '30_MIN_BEFORE');

//     // Schedule the actual appointment notification
//     scheduleMessage(appointmentTime, appointment, 'ON_TIME');
//   });

//   emitter.on(CANCEL_APPOINTMENT, ({ appointment }) => {
//     const { code } = appointment;

//     console.log('Cancelled', code);
//   });
// }

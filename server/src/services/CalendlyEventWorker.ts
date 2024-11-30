import { AppointmentStatus } from "../models/Appointment";
import RedisService from "./RedisService";
import datasources from './dao';

const redisService = new RedisService();

export async function processCalendlyEvent(event: any) {
    switch (event.event) {
        case 'invitee.canceled':

            const cancelPayload = event.payload;
            const inviteeEmail = cancelPayload.email;

            // Store the cancellation event in Redis for future lookup
            await redisService.saveToken(`canceled_${inviteeEmail}`, JSON.stringify(cancelPayload), 3600);

            console.log(`Stored cancellation for ${inviteeEmail}`);
            await datasources.appointmentDAOService.updateByAny(
                { calendly_event: cancelPayload.event.split('scheduled_events/')[1] },
                { status: AppointmentStatus.Canceled }
            )

            break;
        
        case 'invitee.created':
            const payload = await redisService.getToken('de_calendly')

            const createdPayload = event.payload;
            const createdEmail = createdPayload.email;

            const previousCancel = await redisService.getToken(`canceled_${createdEmail}`);

            if (previousCancel) {
                console.log('Meeting was canceled and then recreated (rescheduled)');
                console.log('Canceled Event:', previousCancel);
                console.log('Newly Created Event:');

                const even_id = previousCancel.event.split('scheduled_events/')[1];

                await datasources.appointmentDAOService.updateByAny(
                    { calendly_event: even_id },
                    {
                        calendly_event: even_id,
                        start_time: previousCancel.scheduled_event.start_time,
                        end_time: previousCancel.scheduled_event.end_time,
                        rescheduled: true
                    }
                )

                await redisService.deleteRedisKey(`canceled_${createdEmail}`);
            } else {
                console.log('New meeting created without prior cancellation');
                console.log("createdPayload");
                const invitee = { name: createdPayload.name, email: createdPayload.email }
                await datasources.appointmentDAOService.updateByAny(
                    { _id: payload.appointmentId },
                    {
                        calendly_event: createdPayload.event.split('scheduled_events/')[1],
                        start_time: createdPayload.scheduled_event.start_time,
                        end_time: createdPayload.scheduled_event.end_time,
                        reschedule_url: createdPayload.reschedule_url,
                        event_detail: {
                            event_guests: JSON.stringify(createdPayload.scheduled_event.event_guests),
                            invitees_counter: JSON.stringify(createdPayload.scheduled_event.invitees_counter),
                            meeting_notes_html: createdPayload.scheduled_event.meeting_notes_html,
                            meeting_notes_plain: createdPayload.scheduled_event.meeting_notes_plain,
                            timezone: createdPayload.timezone,
                            invitee: JSON.stringify(invitee),
                            questions_and_answers: JSON.stringify(createdPayload.questions_and_answers),
                            mark_no_show_uri: createdPayload.uri
                        },
                        email: createdPayload.email,
                        firstName: createdPayload.first_name,
                        lastName: createdPayload.last_name
                    }
                )

                await redisService.deleteRedisKey(`de_calendly`);
            }

            break;

        case 'invitee_no_show.created':

            await datasources.appointmentDAOService.updateByAny(
                { calendly_event: event.payload.event.split('scheduled_events/')[1] },
                {
                    no_show: true,
                    status: AppointmentStatus.No_Show
                }
            )

            break;

        default: 
            console.log(`Unhandled event type ${event.type}`);
            break;
    }
}
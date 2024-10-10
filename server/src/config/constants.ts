import { appCommonTypes } from '../@types/app-common';
import QueueEvents = appCommonTypes.QueueEvents;

  export const MESSAGES = {
    http: {
      200: 'Ok',
      201: 'Accepted',
      202: 'Created',
      400: 'Bad Request. Please Contact Support.',
      401: 'You Are Not Authenticated. Please Contact Support.',
      403: 'You Are Forbidden From Accessing This Resource.',
      404: 'Not Found. Please Contact Support.',
      500: 'Something Went Wrong. Please Contact Support.',
      409: 'Conflict. Data already exist.'
    },
    file_type_error: 'Invalid file format.',
    image_size_error: 'Image size exceeds the allowed limit',
    image_type_error: 'Invalid image format. Only JPEG, PNG, and JPG images are allowed',
    media_type_error: 'Invalid format. Only JPEG, PNG, and JPG images and MP4, MKV, FLV, WEBM formats are allowed',
    vid_size_error: 'Video file size exceeds the allowed limit',
    media_size_error: 'Media file size exceeds the allowed limit of 200mb',
    vid_type_error: 'Invalid video format. Only Mp4, WebM, MKV and FLV video formats are allowed'
  };

  export const PACKAGE_REQUEST = 'package_requests';
  export const PACKAGE_REQUEST_INFO = 'package_request_info';

  export const LOG_LEVEL_COLORS = {
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red',
  };

  export const QUEUE_EVENTS_EMAIL: QueueEvents = {
    name: 'DE-EMAIL'
  };

  export const QUEUE_EVENTS_PAYMENT: QueueEvents = {
    name: 'DE-PAYMENT'
  };


  export const AGENDA_COLLECTION_NAME = 'cron_jobs';
  export const AGENDA_SCHEDULE_NAME = 'scheduled_jobs';
  export const BOOK_APPOINTMENT = 'event:BOOK_APPOINTMENT';
  export const CANCEL_APPOINTMENT = 'event:CANCEL_APPOINTMENT';

  export const UPLOAD_BASE_PATH = 'uploads';
  export const HOME_ADDRESS = 'HOME';
  export const OFFICE_ADDRESS = 'OFFICE';

  export const BLACK_PLAN = 'black';
  export const RED_PLAN = 'red';
  export const PURPLE_PLAN = 'purple';
  export const PREMIUM_PURPLE_PLAN = 'premium_purple';

  export const PENDING_VERIFICATION = 'pending';
  export const ACTIVE_VERIFICATION = 'active';
  export const REQUEST_VERIFICATION = 'request';

  export const MAX_SIZE_IN_BYTE = 10000 * 1024; // 10MB
  export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  export const ALLOWED_FILE_TYPES2 = [
    'image/jpeg', 'image/png', 
    'image/jpg', 'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx newer ms word
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
    'text/plain', //.txt
    'application/msword', // .doc older ms word
  ];

  export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mkv', 'video/flv', 'video/webm'];
  export const MAX_SIZE_IN_BYTE_MEDIA = 200 * 1024 * 1024; // 200MB
  export const IMAGE_SIZE = 900000 //900 kb

  export const MAX_SIZE_IN_BYTE_VID = 200 * 1024 * 1024; // 200MB
  export const ALLOWED_FILE_TYPES_VID = ['video/mp4', 'video/mkv', 'video/flv', 'video/webm'];

  export const PAYMENT_CHANNELS = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'eft'];
  export const PAYSTACK_EMAIL='ayurbarmi5@gmail.com';

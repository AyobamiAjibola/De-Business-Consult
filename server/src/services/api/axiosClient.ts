import axios from 'axios';

const CONTENT_TYPE = 'Content-Type';
const ACCEPT = 'Accept';
const APPLICATION_JSON = 'application/json';

axios.defaults.headers.get[ACCEPT] = APPLICATION_JSON;
axios.defaults.headers.delete[ACCEPT] = APPLICATION_JSON;
axios.defaults.headers.post[CONTENT_TYPE] = APPLICATION_JSON;
axios.defaults.headers.patch[CONTENT_TYPE] = APPLICATION_JSON;
axios.defaults.headers.put[CONTENT_TYPE] = APPLICATION_JSON;

export default axios;

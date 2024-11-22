import axios from 'axios';
import datasources from './dao';
import { Response } from 'express'

const {
  CALENDLY_AUTH_BASE_URL,
  CALENDLY_API_BASE_URL,
  CLIENT_SECRET,
  CLIENT_ID,
} = process.env;

class CalendlyService {

  private accessToken: string; 
  private refreshToken: string; 
  private request: any; 
  private requestInterceptor: any; 

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.request = axios.create({
      baseURL: CALENDLY_API_BASE_URL,
    });

    this.requestInterceptor = this.request.interceptors.response.use(
      (res: Response) => res,
      this._onCalendlyError
    );
  }

  requestConfiguration() {
    return {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  }

  getUserInfo = async () => {
    const { data } = await this.request.get(
      '/users/me',
      this.requestConfiguration()
    );

    return data;
  };

  getUserScheduledEvent = async (uuid: string) => {
    const { data } = await this.request.get(
      `/scheduled_events/${uuid}`,
      this.requestConfiguration()
    );

    return data;
  };

  getUserScheduledEventInvitees = async (uuid: string, count: number, pageToken: string) => {
    let queryParams = [`count=${count || 10}`].join('&');

    if (pageToken) queryParams += `&page_token=${pageToken}`;

    const url = `/scheduled_events/${uuid}/invitees?${queryParams}`;

    const { data } = await this.request.get(url, this.requestConfiguration());

    return data;
  };

  getUser = async (userUri: string) => {
    const url = `/users/${userUri}`;

    const { data } = await this.request.get(url, this.requestConfiguration());

    return data;
  };

  markAsNoShow = async (uri: string) => {
    const { data } = await this.request.post(
      '/invitee_no_shows',
      {
        invitee: uri,
      },
      this.requestConfiguration()
    );

    return data;
  };

  undoNoShow = async (inviteeUuid: string) => {
    await this.request.delete(
      `/invitee_no_shows/${inviteeUuid}`,
      this.requestConfiguration()
    );
  };

  cancelEvent = async (uuid: string, reason: string) => {
    const { data } = await this.request.post(
      `/scheduled_events/${uuid}/cancellation`,
      {
        reason: reason,
      },
      this.requestConfiguration()
    );

    return data;
  };

  requestNewAccessToken = () => {
    return axios.post(`${CALENDLY_AUTH_BASE_URL}/oauth/token`, {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    });
  };

  _onCalendlyError = async (error: any) => {
    if (error.response.status !== 401) return Promise.reject(error);

    this.request.interceptors.response.eject(this.requestInterceptor);

    try {
      const response = await this.requestNewAccessToken();
      const { access_token, refresh_token } = response.data;

      const user = await datasources.userDAOService.findByAny({"calendly.accessToken": this.accessToken});

      await datasources.userDAOService.updateByAny({_id: user?.id}, {
        calendly: {
          accessToken: access_token,
          refreshToken: refresh_token,
          uid: user?.calendly.uid
        }
      });

      this.accessToken = access_token;
      this.refreshToken = refresh_token;

      error.response.config.headers.Authorization = `Bearer ${access_token}`;

      // retry original request with new access token
      return this.request(error.response.config);
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

export default CalendlyService;
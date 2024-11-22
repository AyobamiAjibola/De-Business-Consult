import axios from 'axios';

const {
  CALENDLY_API_BASE_URL
} = process.env;

class CalendlyService {

  private accessToken: string;
  private request: any;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.request = axios.create({
      baseURL: CALENDLY_API_BASE_URL,
    });
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

  getUserScheduledEventInvitees = async (uuid: string) => {

    const url = `/scheduled_events/${uuid}/invitees`;

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
}

export default CalendlyService;
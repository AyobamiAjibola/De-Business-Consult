declare module 'agenda-schedule-wrapper' {
  import Agenda from 'agenda';

  export interface AgendaJob {
    attrs: any;
    failCount: number;
    failedAt?: Date;
    lastFinishedAt?: Date;
    lastRunAt?: Date;
    lockedAt?: Date;
    name: string;
    nextRunAt?: Date;
    priority: number;
    running: boolean;
    repeatAt?: string;
    repeatEvery?: string;
    repeatTimezone?: string;
  }

  export class AppAgenda {
    static readonly agenda: Agenda;
    static init(options: any): void;
    static every(interval: string, jobName: string, data?: any): AgendaJob;
    static define(jobName: string, options: any, processor: any): Agenda;
    static cancel(jobName: string): Promise<number>;
  }
}
  
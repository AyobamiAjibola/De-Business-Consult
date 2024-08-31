import datasources from "../services/dao";

export default class CronJob {
  private static isTodaySunday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 2;
  }

  public static async deleteFeedback(): Promise<void> {
    // if (this.isTodaySunday()) {
    // const feedbacks = await datasources.feedbackDAOService.findAll({});
    // const inProgressFeedbacks = feedbacks.filter(
    //   (data) => data.status === "in-progress"
    // );

    // for (const feedback of inProgressFeedbacks) {
    //   await datasources.feedbackDAOService.deleteById(feedback._id);
    // }
    // }
  }

  // public static async sendAppointmentNotification(): Promise<void> {
  //   const emailClients = await datasources.clientDAOService.findAll({
  //     emailNotification: true
  //   });
  // }
}

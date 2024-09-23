import nodemailer from "nodemailer"
import settings from "../config/settings";

class SendMailService {
    private nodemailerConfig = {
        service: settings.nodemailer.service,
        host: settings.nodemailer.host,
        port: settings.nodemailer.port,
        secure: settings.nodemailer.secure,
        user: settings.nodemailer.email,
        pass: settings.nodemailer.password
    };

    private transporter = nodemailer.createTransport ({
        service: this.nodemailerConfig.service,
        host: this.nodemailerConfig.host,
        port: this.nodemailerConfig.port,
        secure: this.nodemailerConfig.secure,
        auth: {
          user: this.nodemailerConfig.user,
          pass: this.nodemailerConfig.pass
        }
    })

    public sendMail(data: any): Promise<any> {
      return new Promise((resolve, reject) => {
        this.transporter.sendMail(data, (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });
    }
};

export default SendMailService;
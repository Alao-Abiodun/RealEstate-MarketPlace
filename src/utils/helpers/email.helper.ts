import 'dotenv/config';
import SES from '../../config/ses.config';
import { SendEmailCommand } from "@aws-sdk/client-ses";

export const sendWelcomeEmail = async (email) => {
    const params = {
        Source: process.env.EMAIL_FROM,
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Subject: {
                Charset: "UTF-8",
                Data: `Welcome to ${process.env.APP_NAME}`,
            },
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `
                            <html>
                                <p>Good day! Welcome to ${process.env.APP_NAME} and
                                thank you for joining us.</p>
                                                    <div style="margin:20px auto;">
                                                        <a href="${process.env.CLIENT_URL}" style="margin-
                                right:50px;">Browse properties</a>
                                                        <a href="${process.env.CLIENT_URL}/post-ad">Post
                                ad</a>
                        `,
                },
            },
        },
        ReplyToAddresses: [process.env.EMAIL_TO],
    }
    const command = new SendEmailCommand(params)
    try {
        const response = await SES.send(command)
        return response;
    } catch (error) {
        throw new Error(error);
    }
}

export const sendPasswordResetEmail = async (email, code) => { const params = {
    Source: process.env.EMAIL_FROM,
    ReplyToAddresses: [process.env.EMAIL_TO],
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
                <html>
                    <p>Good day! Here is your password reset code</p>
                    <h2 style="color:red;">${code}</h2>
                    <i>- Team ${process.env.APP_NAME}</i>
</html> `,
}, },
      Subject: {
        Charset: "UTF-8",
        Data: `Password reset code - ${process.env.APP_NAME}`,
}, },
};
const command = new SendEmailCommand(params); try {
const data = await SES.send(command);
return data;
} catch (error) {
throw error; }
};
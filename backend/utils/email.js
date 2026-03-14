import { Resend } from "resend";
import { env } from "./env.js";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
    console.log(
        `Sending email to ${to} with subject "${subject}" and HTML content: ${html}`
    );
    try {
        const response = await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to,
            subject,
            html,
        });
        console.log("Email sent successfully:", response);
        return response;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
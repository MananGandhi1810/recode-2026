import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";
import { prisma } from "./utils/prisma.js";
import { sendEmail } from "./utils/email.js";
import { env } from "./utils/env.js";
import { redis, ensureRedisConnection } from "./utils/redis.js";

// Define custom permissions for a chat app (in addition to default organization ones)
const statement = {
    ...defaultStatements,
    channel: ["create", "update", "delete", "read", "manage_messages"],
    message: ["create", "delete"],
    thread: ["create", "delete", "manage_messages"],
};

const ac = createAccessControl(statement);

const trustedOrigins = [env.FRONTEND_URL, "http://localhost:3000"];

ensureRedisConnection();

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    secondaryStorage: {
        get: async (key) => {
            return await redis.get(key);
        },
        set: async (key, value, ttl) => {
            if (typeof ttl === "number" && ttl > 0) {
                await redis.set(key, value, { EX: Math.ceil(ttl) });
                return;
            }

            await redis.set(key, value);
        },
        delete: async (key) => {
            await redis.del(key);
        },
    },
    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            allowedAttempts: 3,
            async sendVerificationOTP({ email, otp, type }) {
                let subject = "Your verification code";

                if (type === "sign-in") {
                    subject = "Sign in to your account";
                } else if (type === "email-verification") {
                    subject = "Verify your email address";
                } else if (type === "forget-password") {
                    subject = "Reset your password";
                }

                await sendEmail({
                    to: email,
                    subject,
                    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`,
                });
            },
        }),
        organization({
            ac: ac,
            dynamicAccessControl: {
                enabled: true,
            },
            async sendInvitationEmail(data) {
                const inviteLink = `${env.FRONTEND_URL}/accept-invitation/${data.id}`;
                
                await sendEmail({
                    to: data.email,
                    subject: `You've been invited to join ${data.organization.name}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2>You have been invited!</h2>
                            <p><strong>${data.inviter.user.name}</strong> (${data.inviter.user.email}) has invited you to join the organization <strong>${data.organization.name}</strong>.</p>
                            <br/>
                            <p>Click the button below to accept your invitation to the workspace:</p>
                            <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
                            <br/><br/>
                            <p style="font-size: 14px; color: #666;">If the button does not work, you can also copy and paste the following link into your browser:<br/>
                            <a href="${inviteLink}">${inviteLink}</a></p>
                            <p style="font-size: 12px; color: #999;">This invitation is valid for 48 hours.</p>
                        </div>
                    `,
                });
            },
            schema: {
                organizationRole: {
                    additionalFields: {
                        color: {
                            type: "string",
                            required: false,
                        },
                        isBaseRole: {
                            type: "boolean",
                            required: false,
                            defaultValue: false
                        }
                    }
                },
                member: {
                    additionalFields: {
                        isBanned: {
                            type: "boolean",
                            required: false,
                            defaultValue: false
                        }
                    }
                }
            }
        })
    ],
});
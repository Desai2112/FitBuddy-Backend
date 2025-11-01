import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP for email verification is: ${otp}`
    });
}; 


export const sendEmail = async ({ email, subject, template, data }) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Define email templates
    const templates = {
        appointmentConfirmation: `Hello ${data.name},\n\nYour appointment with Dr. ${data.doctorName} is confirmed for ${data.date} from ${data.time} (${data.mode}).\n\nThank you!`,
        appointmentUpdate: `Hello ${data.name},\n\nYour appointment with Dr. ${data.doctorName} has been Completed\n\nThank you!`,
        appointmentCancellation: `Hello ${data.name},\n\nYour appointment with Dr. ${data.doctorName} scheduled for ${data.date} from ${data.time} has been cancelled.\n\nThank you!`
    };

    // Select the correct template
    const emailBody = templates[template] || `Hello ${data.name},\n\nYou have an appointment update.\n\nThank you!`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text: emailBody
    });
};

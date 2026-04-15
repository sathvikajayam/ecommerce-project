import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  // Read environment variables at runtime, not module load time
  const mailgunHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const mailgunPort = Number(process.env.SMTP_PORT || 587);
  const mailgunUser = process.env.SMTP_USER;
  const mailgunPass = process.env.SMTP_PASS;

  if (!mailgunUser || !mailgunPass) {
    throw new Error("Gmail SMTP configuration is incomplete. Set SMTP_USER and SMTP_PASS in your environment.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: mailgunHost,
      port: mailgunPort,
      secure: mailgunPort === 465,
      auth: {
        user: mailgunUser,
        pass: mailgunPass,
      },
    });
  }

  return transporter;
};

const buildEmailPayload = ({ to, subject, text, html }) => {
  const mailgunUser = process.env.SMTP_USER;
  const fromAddress = process.env.MAIL_FROM || mailgunUser || "no-reply@example.com";

  return {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const message = buildEmailPayload({
    to,
    subject: "Reset your password",
    text: [
      `Hi ${name || "there"},`,
      "",
      "We received a request to reset your password.",
      `Reset it here: ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>Hi ${name || "there"},</p>
        <p>We received a request to reset your password.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:999px;"
          >
            Reset Password
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  await getTransporter().sendMail(message);
};

export const sendOrderPlacedEmail = async ({ to, customerName, orderId, items, total, shippingAddress }) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.qty}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const addressHtml = [
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.pincode,
  ].filter(Boolean)
   .map(line => `<p style="margin: 0;">${line}</p>`)
   .join('');

  const message = buildEmailPayload({
    to,
    subject: `Order Confirmation - ${orderId}`,
    text: `Hi ${customerName || "there"},\n\nThank you for your order! We've received your order ${orderId} and it is now being processed.\n\nTotal: ₹${Number(total).toFixed(2)}\n\nShipping Address:\n${[
      shippingAddress.line1,
      shippingAddress.line2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.pincode,
    ].filter(Boolean).join("\n")}\n\nThank you for shopping with us!`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #111827; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Placed Successfully!</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi ${customerName || "there"},</p>
          <p>Thank you for your order! We've received your order <strong>${orderId}</strong> and it is now being processed.</p>

          <h3 style="margin-top: 24px; border-bottom: 2px solid #111827; padding-bottom: 8px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">₹${Number(total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
            <h4 style="margin: 0 0 8px 0;">Shipping Address</h4>
            ${addressHtml}
          </div>

          <p style="margin-top: 24px;">If you have any questions, feel free to contact our support team.</p>
          <p>Thank you for shopping with us!</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          <p>© ${new Date().getFullYear()} Your E-Commerce Store. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  await getTransporter().sendMail(message);
};

export const sendOrderDeliveredEmail = async ({ to, customerName, orderId }) => {
  const message = buildEmailPayload({
    to,
    subject: `Order Delivered - ${orderId}`,
    text: `Hi ${customerName || "there"},\n\nGreat news! Your order ${orderId} has been delivered.\n\nWe hope you enjoy your purchase!`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Order Delivered!</h1>
        </div>

        <div style="padding: 24px;">
          <p>Hi ${customerName || "there"},</p>
          <p>Great news! Your order <strong>${orderId}</strong> has been delivered.</p>
          <p>We hope you enjoy your purchase! If you have any feedback or concerns, please don't hesitate to reach out to us.</p>

          <div style="margin-top: 24px; text-align: center;">
            <a
              href="${process.env.FRONTEND_URL || '#'}"
              style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:bold;"
            >
              Shop More
            </a>
          </div>

          <p style="margin-top: 24px;">Thank you for shopping with us!</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
          <p>© ${new Date().getFullYear()} Your E-Commerce Store. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  await getTransporter().sendMail(message);
};
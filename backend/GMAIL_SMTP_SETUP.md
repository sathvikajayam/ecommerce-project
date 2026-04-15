Gmail SMTP Setup for Email Integration:

Add these variables to `backend/.env`:

```env
FRONTEND_URL=https://your-frontend-url.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=your-gmail@gmail.com
```

## Gmail App Password Setup:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (custom name)"
   - Enter "E-commerce App" as the name
   - Copy the 16-character password
3. **Use this App Password** in `SMTP_PASS`

## Email Features Implemented:

✅ **Forgot Password (User)**: `/api/users/forgot-password`
✅ **Forgot Password (Admin)**: `/api/admin/forgot-password`
✅ **Order Confirmation**: Sent when order is placed
✅ **Order Delivered**: Sent when order status updated to "Delivered"

## Notes:

- `FRONTEND_URL` should match your frontend app URL
- `SMTP_USER` should be your Gmail address
- `SMTP_PASS` should be the 16-character app password (not your regular password)
- After updating env values, restart the backend server
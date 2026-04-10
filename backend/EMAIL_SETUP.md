Password reset email setup:

Add these variables to `backend/.env`:

```env
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
MAIL_FROM=your-email@example.com
```

Notes:

- `FRONTEND_URL` should match the frontend app that serves `/reset-password/:token`.
- For Gmail, use an app password instead of your normal account password.
- After updating env values, restart the backend server.

# Contact Form Email Setup

This API route handles contact form submissions and sends emails to `contact@diggr.xyz`.

## Configuration

To make the email functionality work, you need to set up environment variables in your `.env.local` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@diggr.xyz
```

## Gmail Setup Instructions

If you're using Gmail as your email provider:

1. You'll need to use an App Password instead of your regular password
2. Visit https://myaccount.google.com/apppasswords to generate one
3. Make sure 2-Factor Authentication is enabled on your Google account
4. Select "App" and "Other" and give it a name (e.g., "Diggr Contact Form")
5. Copy the generated password and use it as your `EMAIL_PASS` value

## Other Email Providers

You can use any SMTP provider by changing the `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_SECURE` values accordingly.

## Testing

You can test the API endpoint using tools like Postman or curl:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test Message","message":"This is a test message"}'
```

## Security Considerations

- Never commit your `.env.local` file to version control
- Consider using environment variables in your deployment platform (Vercel, Netlify, etc.)
- For production, consider using a transactional email service like SendGrid, Mailgun, or Amazon SES 
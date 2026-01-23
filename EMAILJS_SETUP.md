# EmailJS Setup Instructions

To enable direct email sending from your contact form, follow these steps:

## 1. Create EmailJS Account
- Go to https://www.emailjs.com/
- Sign up for a free account (200 emails/month free)

## 2. Add Email Service
- Go to "Email Services" in the dashboard
- Click "Add New Service"
- Choose Gmail (recommended) or Outlook
- Connect your email account (arsunke@umich.edu)
- Copy the **Service ID**

## 3. Create Email Template
- Go to "Email Templates" in the dashboard
- Click "Create New Template"
- Use this template:

**Subject:** Portfolio Contact from {{from_name}}

**Content:**
```
You have a new message from your portfolio website.

From: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
Reply to: {{reply_to}}
```

- Save the template and copy the **Template ID**

## 4. Get Public Key
- Go to "Account" → "General"
- Copy your **Public Key**

## 5. Configure Your App

Create a `.env` file in the root of your project:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

Replace the placeholder values with your actual IDs from EmailJS.

## 6. Restart Your Dev Server
After adding the `.env` file, restart your development server:
```bash
npm run dev
```

That's it! Your contact form will now send emails directly to arsunke@umich.edu without opening an email client.

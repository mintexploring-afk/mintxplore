import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { NewsletterSubscription } from '@/models/NewsletterSubscription';
import { sendMail } from '@/utils/sendMail';

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find all active newsletter subscriptions
    const subscribers = await NewsletterSubscription.find({ status: 'active' });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: 'No active subscribers found', sentCount: 0 },
        { status: 200 }
      );
    }

    // Create HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .message {
              white-space: pre-wrap;
              margin: 20px 0;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 8px 8px;
              font-size: 14px;
              color: #6b7280;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .unsubscribe {
              color: #9ca3af;
              font-size: 12px;
              margin-top: 10px;
            }
            .unsubscribe a {
              color: #9ca3af;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎨 Opalineart</h1>
          </div>
          <div class="content">
            <h2 style="color: #667eea; margin-top: 0;">${subject}</h2>
            <div class="message">${message}</div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
              Visit Opalineart
            </a>
          </div>
          <div class="footer">
            <p>You're receiving this email because you're subscribed to Opalineart newsletter.</p>
            <p class="unsubscribe">
              To unsubscribe, please visit your profile settings or 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/edit-profile">click here</a>
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendMail({
          to: subscriber.email,
          subject: subject,
          html: htmlContent,
        });
        
        // Update lastEmailSentAt
        subscriber.lastEmailSentAt = new Date();
        await subscriber.save();
        
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      message: 'Newsletter sent successfully',
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  // Simple implementation that can be expanded or connected to a real email provider
  console.log("Sending email:", payload);
  
  // In a production environment, you would use an email service like SendGrid, Mailgun, etc.
  // Example with a mock implementation for now
  try {
    // Log email being sent in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email would be sent in production:');
      console.log('To:', payload.to);
      console.log('Subject:', payload.subject);
      console.log('HTML:', payload.html.substring(0, 200) + '...');
    }
    
    // In production you would add the actual email sending logic here
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function startupCreationTemplate(options: {
  startupName: string;
  startupId: string;
  userId: string;
  userName: string;
  createdAt: string;
}) {
  const { startupName, startupId, userId, userName, createdAt } = options;
  
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Startup Created</h2>
      <p>A new startup has been submitted and is pending review:</p>
      <ul>
        <li><strong>Name:</strong> ${startupName}</li>
        <li><strong>ID:</strong> ${startupId}</li>
        <li><strong>Created by:</strong> ${userName} (${userId})</li>
        <li><strong>Created at:</strong> ${new Date(createdAt).toLocaleString()}</li>
      </ul>
      <p>Please review this startup in the admin moderation panel.</p>
    </div>
  `;
} 
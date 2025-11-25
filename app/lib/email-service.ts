import { Resend } from 'resend';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

interface WelcomeEmailData {
  firstName: string;
  email: string;
  verificationUrl: string;
}

interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
  expiresIn: string;
}

interface CollaborationInviteData {
  inviterName: string;
  sessionName: string;
  joinUrl: string;
  fileName?: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@neurolint.dev';
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn('[EMAIL] Resend API key not found. Email features will be mocked.');
    }
  }

  private async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.resend) {
      // Mock email in development
      console.log('[EMAIL MOCK] Email would be sent:', {
        to: options.to,
        subject: options.subject,
        from: options.from || this.fromEmail
      });
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`
      };
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html || '',
        text: options.text || ''
      });

      if (result.error) {
        console.error('[EMAIL] Send error:', result.error);
        return {
          success: false,
          error: result.error.message || 'Failed to send email'
        };
      }

      console.log('[EMAIL] Email sent successfully:', result.data?.id);
      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error) {
      console.error('[EMAIL] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    const template = this.generateWelcomeTemplate(data);
    
    return await this.sendEmail({
      to: data.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
    const template = this.generatePasswordResetTemplate(data);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendEmailVerification(email: string, verificationUrl: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
    const template = this.generateEmailVerificationTemplate({
      firstName: firstName || 'User',
      email,
      verificationUrl
    });
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendCollaborationInvite(email: string, data: CollaborationInviteData): Promise<{ success: boolean; error?: string }> {
    const template = this.generateCollaborationInviteTemplate(data);
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  async sendAnalysisNotification(email: string, sessionName: string, issuesFound: number, fileName: string): Promise<{ success: boolean; error?: string }> {
    const template = this.generateAnalysisNotificationTemplate({
      sessionName,
      issuesFound,
      fileName,
      dashboardUrl: `${this.baseUrl}/dashboard`
    });
    
    return await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  private generateWelcomeTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = 'Welcome to NeuroLint Pro!';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #2196f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .features { background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .feature { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to NeuroLint Pro!</h1>
            <p>Advanced React/Next.js code analysis and collaboration</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.firstName}!</h2>
            
            <p>Welcome to NeuroLint Pro! We're excited to have you join our community of developers who are passionate about writing better, cleaner React and Next.js code.</p>
            
            <div class="features">
                <h3>What you can do with NeuroLint Pro:</h3>
                <div class="feature">✓ Real-time code analysis with 6 intelligent layers</div>
                <div class="feature">✓ Collaborative debugging sessions with your team</div>
                <div class="feature">✓ Automated fixes for common React/Next.js issues</div>
                <div class="feature">✓ SSR hydration problem detection and resolution</div>
                <div class="feature">✓ Performance optimization suggestions</div>
                <div class="feature">✓ Team collaboration and code reviews</div>
            </div>
            
            <p>To get started, please verify your email address:</p>
            
            <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Once verified, you'll have access to your dashboard where you can start analyzing code, create collaboration sessions, and explore all the features NeuroLint Pro has to offer.</p>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Happy coding!</p>
            <p><strong>The NeuroLint Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${data.email}</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Welcome to NeuroLint Pro!

Hi ${data.firstName}!

Welcome to NeuroLint Pro! We're excited to have you join our community of developers.

To get started, please verify your email address by visiting: ${data.verificationUrl}

What you can do with NeuroLint Pro:
- Real-time code analysis with 6 intelligent layers
- Collaborative debugging sessions with your team
- Automated fixes for common React/Next.js issues
- SSR hydration problem detection and resolution
- Performance optimization suggestions
- Team collaboration and code reviews

Once verified, you'll have access to your dashboard where you can start analyzing code and exploring all features.

Happy coding!
The NeuroLint Pro Team

This email was sent to ${data.email}
    `;

    return { subject, html, text };
  }

  private generatePasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
    const subject = 'Reset Your NeuroLint Pro Password';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #2196f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .warning { background: #fef3cd; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.firstName}!</h2>
            
            <p>We received a request to reset your NeuroLint Pro password. If you requested this reset, click the button below to create a new password:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This password reset link will expire in ${data.expiresIn}. If you don't reset your password within this time, you'll need to request a new reset link.
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, if you continue to receive password reset emails that you didn't request, please contact our support team immediately.</p>
            
            <p><strong>The NeuroLint Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${data.resetUrl}</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Password Reset Request

Hi ${data.firstName}!

We received a request to reset your NeuroLint Pro password.

To reset your password, visit: ${data.resetUrl}

This link will expire in ${data.expiresIn}.

If you didn't request a password reset, you can safely ignore this email.

The NeuroLint Pro Team
    `;

    return { subject, html, text };
  }

  private generateEmailVerificationTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = 'Verify Your NeuroLint Pro Email';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2196f3, #1976d2); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #2196f3; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.firstName}!</h2>
            
            <p>Please verify your email address to complete your NeuroLint Pro account setup and access all features.</p>
            
            <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>Access your personal dashboard</li>
                <li>Create and join collaboration sessions</li>
                <li>Save your analysis history</li>
                <li>Manage your account settings</li>
            </ul>
            
            <p>If you didn't create this account, you can safely ignore this email.</p>
            
            <p><strong>The NeuroLint Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${data.email}</p>
            <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${data.verificationUrl}</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Verify Your Email

Hi ${data.firstName}!

Please verify your email address to complete your NeuroLint Pro account setup.

Verification link: ${data.verificationUrl}

Once verified, you'll have access to all features including your dashboard, collaboration sessions, and analysis history.

The NeuroLint Pro Team

This email was sent to ${data.email}
    `;

    return { subject, html, text };
  }

  private generateCollaborationInviteTemplate(data: CollaborationInviteData): EmailTemplate {
    const subject = `You're invited to collaborate on "${data.sessionName}"`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #4caf50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .session-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Collaboration Invitation</h1>
        </div>
        
        <div class="content">
            <h2>You're invited to collaborate!</h2>
            
            <p><strong>${data.inviterName}</strong> has invited you to join a collaborative code analysis session on NeuroLint Pro.</p>
            
            <div class="session-details">
                <h3>Session Details:</h3>
                <p><strong>Session:</strong> ${data.sessionName}</p>
                ${data.fileName ? `<p><strong>File:</strong> ${data.fileName}</p>` : ''}
                <p><strong>Invited by:</strong> ${data.inviterName}</p>
            </div>
            
            <p>Join the session to collaborate in real-time on code analysis, share insights, and work together to improve code quality.</p>
            
            <div style="text-align: center;">
                <a href="${data.joinUrl}" class="button">Join Collaboration Session</a>
            </div>
            
            <p>In this session, you'll be able to:</p>
            <ul>
                <li>Analyze code together in real-time</li>
                <li>See live cursor movements and changes</li>
                <li>Add comments and suggestions</li>
                <li>Run analysis layers collaboratively</li>
                <li>Chat with other participants</li>
            </ul>
            
            <p>Don't have a NeuroLint Pro account yet? No problem! You can sign up for free when you join the session.</p>
            
            <p><strong>The NeuroLint Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${data.joinUrl}</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Collaboration Invitation

You're invited to collaborate!

${data.inviterName} has invited you to join a collaborative code analysis session on NeuroLint Pro.

Session: ${data.sessionName}
${data.fileName ? `File: ${data.fileName}` : ''}
Invited by: ${data.inviterName}

Join the session: ${data.joinUrl}

In this session, you'll be able to analyze code together in real-time, see live changes, add comments, and collaborate on improving code quality.

The NeuroLint Pro Team
    `;

    return { subject, html, text };
  }

  private generateAnalysisNotificationTemplate(data: {
    sessionName: string;
    issuesFound: number;
    fileName: string;
    dashboardUrl: string;
  }): EmailTemplate {
    const subject = `Analysis Complete: ${data.issuesFound} issues found in ${data.fileName}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: #ff9800; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .results { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .issue-count { font-size: 48px; font-weight: bold; color: #ff9800; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Analysis Complete</h1>
        </div>
        
        <div class="content">
            <h2>Code Analysis Results</h2>
            
            <p>The analysis for your collaboration session "<strong>${data.sessionName}</strong>" has been completed.</p>
            
            <div class="results">
                <div class="issue-count">${data.issuesFound}</div>
                <p><strong>Issues Found</strong></p>
                <p>in ${data.fileName}</p>
            </div>
            
            <p>The analysis has identified ${data.issuesFound} potential ${data.issuesFound === 1 ? 'issue' : 'issues'} that may need attention. Review the detailed results in your dashboard to see specific recommendations and potential fixes.</p>
            
            <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Detailed Results</a>
            </div>
            
            <p>You can also share these results with your team members and continue collaborating on improvements.</p>
            
            <p><strong>The NeuroLint Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <p>View your dashboard: ${data.dashboardUrl}</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
Analysis Complete

The analysis for your collaboration session "${data.sessionName}" has been completed.

Results: ${data.issuesFound} issues found in ${data.fileName}

View detailed results in your dashboard: ${data.dashboardUrl}

The NeuroLint Pro Team
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();

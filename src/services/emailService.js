// Email Service for sending user invitations and notifications
import { supabase } from '../lib/supabase';

class EmailService {
    constructor() {
        // You can configure different email providers here
        this.emailProvider = 'supabase'; // or 'sendgrid', 'resend', etc.
    }

    /**
     * Send welcome email to new user
     * @param {Object} userData - User data
     * @param {string} userData.email - User email
     * @param {string} userData.fullName - User full name
     * @param {string} userData.tempPassword - Temporary password
     * @param {string} userData.userType - User type
     */
    async sendWelcomeEmail(userData) {
        try {
            const emailContent = this.generateWelcomeEmailContent(userData);
            
            // For now, we'll use a simple approach
            // In production, you'd integrate with SendGrid, Resend, or other email service
            
            console.log('📧 Welcome email would be sent to:', userData.email);
            console.log('Email content:', emailContent);
            
            // Simulate email sending
            return {
                success: true,
                message: 'Welcome email sent successfully'
            };
            
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate welcome email content
     */
    generateWelcomeEmailContent(userData) {
        return {
            to: userData.email,
            subject: '🎉 Welcome to Glossa - Your Account is Ready!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #10b981; margin: 0;">Welcome to Glossa!</h1>
                        <p style="color: #666; font-size: 16px;">Your translation platform account is ready</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Account Details</h2>
                        <p><strong>Name:</strong> ${userData.fullName}</p>
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Role:</strong> ${userData.userType}</p>
                        <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${userData.tempPassword}</code></p>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                        <h3 style="color: #92400e; margin-top: 0;">🔐 Important Security Notice</h3>
                        <p style="color: #92400e; margin-bottom: 0;">Please change your password immediately after your first login for security purposes.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${window.location.origin}/login" 
                           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Login to Your Account
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                        <h3 style="color: #1f2937;">Next Steps:</h3>
                        <ol style="color: #4b5563; line-height: 1.6;">
                            <li>Click the login button above</li>
                            <li>Use your email and temporary password to sign in</li>
                            <li>Update your password in account settings</li>
                            <li>Complete your profile information</li>
                            <li>Start exploring the platform!</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                        <p>Need help? Contact our support team or check our documentation.</p>
                        <p>© 2024 Glossa Translation Platform</p>
                    </div>
                </div>
            `,
            text: `
Welcome to Glossa!

Your account has been created with the following details:
- Name: ${userData.fullName}
- Email: ${userData.email}
- Role: ${userData.userType}
- Temporary Password: ${userData.tempPassword}

IMPORTANT: Please change your password after your first login.

Login at: ${window.location.origin}/login

Next Steps:
1. Login with your email and temporary password
2. Change your password in account settings
3. Complete your profile information
4. Start using the platform!

Need help? Contact our support team.
            `
        };
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new EmailService();
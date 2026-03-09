import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { notificationId } = await req.json()
    
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get notification details
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data)
      `)
      .eq('id', notificationId)
      .single()
    
    if (notifError || !notification) {
      throw new Error('Notification not found')
    }
    
    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Glossa CAT <noreply@glossa.agency>',
        to: [notification.user.email],
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Glossa CAT</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #667eea; margin-top: 0;">${notification.title}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">${notification.message}</p>
              ${notification.link ? `
                <a href="https://glossa-one.vercel.app${notification.link}" 
                   style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600;">
                  Open Workspace →
                </a>
              ` : ''}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                This is an automated message from Glossa CAT. Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }
    
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

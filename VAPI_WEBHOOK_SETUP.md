# VAPI Webhook Setup for Live Call Tracking

## ⚠️ CRITICAL: Webhook Configuration Required

For live call tracking to work, you MUST configure the webhook URL in your VAPI dashboard.

## Webhook URL
```
https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-webhook
```

## Setup Steps:

1. **Go to VAPI Dashboard**: https://dashboard.vapi.ai
2. **Navigate to**: Settings > Webhooks
3. **Add Webhook URL**: 
   ```
   https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-webhook
   ```
4. **Select Events**:
   - ✅ `call.started` - When call begins
   - ✅ `call.ended` - When call completes 
   - ✅ `call.failed` - When call fails
   - ✅ `transcript` - Real-time transcript updates

5. **Save Configuration**

## How It Works:

1. **Call Initiated** → VAPI starts the call
2. **Call Events** → VAPI sends webhook to our endpoint  
3. **Data Processing** → Our webhook extracts customer responses
4. **Database Update** → Saves call data and attendance status
5. **Live Dashboard** → Call Monitor shows real-time results

## Verify Setup:

After configuring the webhook:
1. Make a test call to a real number
2. Check the Call Monitor dashboard
3. Look for the call session and customer response

## Troubleshooting:

If calls aren't showing up:
- Verify webhook URL is correct in VAPI dashboard
- Check edge function logs for webhook events
- Ensure VAPI account has webhook permissions
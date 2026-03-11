import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Phone, Mail, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgeVerificationProps {
  orderId: string;
  customerPhone: string;
  onVerificationComplete: (verified: boolean) => void;
  requiredAge?: number;
}

interface VerificationRecord {
  id: string;
  verification_method: string;
  verification_status: string;
  verified_age?: number;
  otp_code?: string;
  expires_at?: string;
  created_at: string;
}

export function AgeVerification({ 
  orderId, 
  customerPhone, 
  onVerificationComplete, 
  requiredAge = 21 
}: AgeVerificationProps) {
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [customerAge, setCustomerAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'sms_otp' | 'voice_confirmation'>('sms_otp');

  useEffect(() => {
    loadExistingVerification();
  }, [orderId]);

  const loadExistingVerification = async () => {
    try {
      const { data, error } = await supabase
        .from("age_verifications")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setVerificationRecord(data[0]);
      }
    } catch (error) {
      console.error("Error loading verification:", error);
    }
  };

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendSMSOTP = async () => {
    try {
      setLoading(true);
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

      // Create verification record
      const { data, error } = await supabase
        .from("age_verifications")
        .insert({
          order_id: orderId,
          customer_phone: customerPhone,
          verification_method: 'sms_otp',
          verification_status: 'pending',
          otp_code: otp,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send SMS via Twilio edge function
      const { error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          to: customerPhone,
          message: `Your age verification code for liquor purchase: ${otp}. Code expires in 10 minutes. Must be ${requiredAge}+ to purchase.`
        }
      });

      if (smsError) {
        console.error("SMS sending failed:", smsError);
        toast.error("Failed to send verification code");
        return;
      }

      setVerificationRecord(data);
      toast.success("Verification code sent via SMS");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to initiate age verification");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!verificationRecord || !otpCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);

      // Check if OTP has expired
      if (verificationRecord.expires_at && new Date() > new Date(verificationRecord.expires_at)) {
        toast.error("Verification code has expired. Please request a new one.");
        return;
      }

      // Verify OTP
      if (otpCode !== verificationRecord.otp_code) {
        toast.error("Invalid verification code");
        return;
      }

      // Get customer age
      const age = parseInt(customerAge);
      if (!age || age < requiredAge) {
        await supabase
          .from("age_verifications")
          .update({
            verification_status: 'failed',
            verified_age: age || 0
          })
          .eq("id", verificationRecord.id);

        toast.error(`Customer must be ${requiredAge} or older to purchase liquor`);
        onVerificationComplete(false);
        return;
      }

      // Update verification as successful
      const { error } = await supabase
        .from("age_verifications")
        .update({
          verification_status: 'verified',
          verified_age: age
        })
        .eq("id", verificationRecord.id);

      if (error) throw error;

      toast.success("Age verification successful!");
      onVerificationComplete(true);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceConfirmation = async () => {
    try {
      setLoading(true);
      const age = parseInt(customerAge);
      
      if (!age || age < requiredAge) {
        toast.error(`Customer must be ${requiredAge} or older`);
        return;
      }

      const { data, error } = await supabase
        .from("age_verifications")
        .insert({
          order_id: orderId,
          customer_phone: customerPhone,
          verification_method: 'voice_confirmation',
          verification_status: 'verified',
          verified_age: age
        })
        .select()
        .single();

      if (error) throw error;

      setVerificationRecord(data);
      toast.success("Voice age verification completed");
      onVerificationComplete(true);
    } catch (error) {
      console.error("Error with voice verification:", error);
      toast.error("Voice verification failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'expired':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (verificationRecord?.verification_status === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Age Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-green-700">
              Customer age verified: {verificationRecord.verified_age} years old
            </p>
            <p className="text-xs text-green-600">
              Verified on {new Date(verificationRecord.created_at).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          Age Verification Required
        </CardTitle>
        <CardDescription>
          Liquor sales require age verification for customers {requiredAge}+ years
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationRecord && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">Current Status:</span>
            {getStatusBadge(verificationRecord.verification_status)}
          </div>
        )}

        {/* Verification Method Selection */}
        <div className="flex gap-2">
          <Button
            variant={method === 'sms_otp' ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod('sms_otp')}
          >
            <Phone className="w-4 h-4 mr-1" />
            SMS Verification
          </Button>
          <Button
            variant={method === 'voice_confirmation' ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod('voice_confirmation')}
          >
            Voice Confirmation
          </Button>
        </div>

        {method === 'sms_otp' && (
          <div className="space-y-3">
            {!verificationRecord || verificationRecord.verification_status === 'expired' ? (
              <Button 
                onClick={sendSMSOTP} 
                disabled={loading}
                className="w-full"
              >
                Send Verification Code
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Enter verification code sent to {customerPhone}</label>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Customer's Age</label>
                  <Input
                    type="number"
                    placeholder="Enter customer's age"
                    value={customerAge}
                    onChange={(e) => setCustomerAge(e.target.value)}
                    min={requiredAge}
                  />
                </div>
                <Button 
                  onClick={verifyOTP} 
                  disabled={loading || !otpCode || !customerAge}
                  className="w-full"
                >
                  Verify Age
                </Button>
              </div>
            )}
          </div>
        )}

        {method === 'voice_confirmation' && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Confirmed Customer Age</label>
              <Input
                type="number"
                placeholder={`Customer must be ${requiredAge}+ years old`}
                value={customerAge}
                onChange={(e) => setCustomerAge(e.target.value)}
                min={requiredAge}
              />
            </div>
            <Button 
              onClick={handleVoiceConfirmation} 
              disabled={loading || !customerAge}
              className="w-full"
            >
              Confirm Age Verification
            </Button>
            <p className="text-xs text-muted-foreground">
              Use this method only after verbally confirming the customer's age during the call
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
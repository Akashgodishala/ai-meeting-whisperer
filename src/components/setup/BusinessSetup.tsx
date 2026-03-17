/**
 * BusinessSetup – a guided 4-step wizard that every new business must complete
 * before making live calls. Persists the profile to localStorage + Supabase.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCredentials } from "@/hooks/useCredentials";
import {
  Building2,
  Phone,
  Key,
  Bot,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Info,
  Mic,
  Clock,
  Globe,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  phone: string;
  website?: string;
  timezone: string;
  operatingHours: { open: string; close: string; days: string[] };
  agentGreeting: string;
  agentPersonality: string;
}

const PROFILE_KEY = "voxorbit_business_profile";
const SETUP_DONE_KEY = "voxorbit_setup_done";

const BUSINESS_TYPES = [
  "Restaurant / Food Delivery",
  "Retail Store",
  "Salon / Barbershop",
  "Medical / Dental Clinic",
  "Auto Service",
  "Real Estate",
  "Legal Services",
  "Home Services (Plumbing / HVAC / Electric)",
  "Fitness / Gym",
  "Hospitality / Hotel",
  "Other",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PERSONALITIES = [
  { id: "professional", label: "Professional & Formal", desc: "Polite, businesslike tone" },
  { id: "friendly", label: "Friendly & Warm", desc: "Casual, welcoming tone" },
  { id: "energetic", label: "Energetic & Upbeat", desc: "Enthusiastic and positive" },
  { id: "calm", label: "Calm & Reassuring", desc: "Soothing, unhurried voice" },
];

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2, desc: "Tell us about your business" },
  { id: 2, title: "Credentials", icon: Key, desc: "Connect Vapi & Twilio" },
  { id: 3, title: "Agent Voice", icon: Bot, desc: "Customize how your AI sounds" },
  { id: 4, title: "All Set!", icon: CheckCircle, desc: "Review and launch" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadProfile(): BusinessProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignored */ }
  return {
    businessName: "",
    businessType: "",
    phone: "",
    website: "",
    timezone: "America/New_York",
    operatingHours: { open: "09:00", close: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    agentGreeting: "",
    agentPersonality: "friendly",
  };
}

function saveProfile(p: BusinessProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BusinessSetupProps {
  onComplete?: () => void;
}

export const BusinessSetup = ({ onComplete }: BusinessSetupProps) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<BusinessProfile>(loadProfile);
  const [saving, setSaving] = useState(false);

  const {
    vapiCredentials,
    setVapiCredentials,
    smsCredentials,
    setSmsCredentials,
    saveVAPICredentials,
    saveSMSCredentials,
    hasVAPICredentials,
    hasSMSCredentials,
  } = useCredentials();

  // Auto-generate greeting when business name changes
  useEffect(() => {
    if (profile.businessName && !profile.agentGreeting) {
      setProfile((p) => ({
        ...p,
        agentGreeting: `Hi! Thanks for calling ${profile.businessName}. I'm your AI assistant. How can I help you today?`,
      }));
    }
  }, [profile.businessName]);

  const updateProfile = (patch: Partial<BusinessProfile>) =>
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveProfile(next);
      return next;
    });

  const toggleDay = (day: string) => {
    const days = profile.operatingHours.days.includes(day)
      ? profile.operatingHours.days.filter((d) => d !== day)
      : [...profile.operatingHours.days, day];
    updateProfile({ operatingHours: { ...profile.operatingHours, days } });
  };

  const canProceed = () => {
    if (step === 1) return Boolean(profile.businessName && profile.businessType && profile.phone);
    if (step === 2) return hasVAPICredentials;
    if (step === 3) return Boolean(profile.agentGreeting && profile.agentPersonality);
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Persist profile to Supabase user metadata if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { business_profile: profile },
        });
      }
      saveProfile(profile);
      localStorage.setItem(SETUP_DONE_KEY, "true");
      toast.success("Business profile saved! Your AI agent is ready to go.");
      onComplete?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Set Up Your AI Voice Agent</h1>
        <p className="text-sm text-muted-foreground">
          Complete the setup in 4 simple steps — takes under 5 minutes
        </p>
        <Progress value={progress} className="h-2 max-w-sm mx-auto" />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border -z-10" />
        {STEPS.map(({ id, title, icon: Icon }) => (
          <button
            key={id}
            onClick={() => id < step && setStep(id)}
            className={`flex flex-col items-center gap-1.5 ${id < step ? "cursor-pointer" : "cursor-default"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                id < step
                  ? "bg-primary border-primary text-primary-foreground"
                  : id === step
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-background border-border text-muted-foreground"
              }`}
            >
              {id < step ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block ${
                id === step ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {title}
            </span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <Card className="border-2 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {(() => {
              const s = STEPS[step - 1];
              return (
                <>
                  <s.icon className="h-5 w-5 text-primary" />
                  {s.title}
                </>
              );
            })()}
          </CardTitle>
          <CardDescription>{STEPS[step - 1].desc}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Step 1: Business Info ──────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bname">Business Name *</Label>
                    <Input
                      id="bname"
                      placeholder="e.g. Tony's Pizza"
                      value={profile.businessName}
                      onChange={(e) => updateProfile({ businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="btype">Business Type *</Label>
                    <Select
                      value={profile.businessType}
                      onValueChange={(v) => updateProfile({ businessType: v })}
                    >
                      <SelectTrigger id="btype">
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bphone">Business Phone *</Label>
                    <Input
                      id="bphone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={profile.phone}
                      onChange={(e) => updateProfile({ phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bweb">Website (optional)</Label>
                    <Input
                      id="bweb"
                      type="url"
                      placeholder="https://yourbusiness.com"
                      value={profile.website}
                      onChange={(e) => updateProfile({ website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(v) => updateProfile({ timezone: v })}
                  >
                    <SelectTrigger>
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Operating Hours
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="time"
                      value={profile.operatingHours.open}
                      onChange={(e) =>
                        updateProfile({
                          operatingHours: { ...profile.operatingHours, open: e.target.value },
                        })
                      }
                      className="w-36"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={profile.operatingHours.close}
                      onChange={(e) =>
                        updateProfile({
                          operatingHours: { ...profile.operatingHours, close: e.target.value },
                        })
                      }
                      className="w-36"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                          profile.operatingHours.days.includes(d)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: Credentials ────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Your keys are saved locally and used to authenticate VAPI/Twilio calls. For
                  production, also set them as{" "}
                  <a
                    href="https://supabase.com/docs/guides/functions/secrets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-0.5"
                  >
                    Supabase Secrets <ExternalLink className="h-3 w-3" />
                  </a>
                  .
                </AlertDescription>
              </Alert>

              {/* VAPI */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm text-foreground">VAPI (AI Voice Calls)</h4>
                  {hasVAPICredentials && (
                    <Badge className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                      ✓ Configured
                    </Badge>
                  )}
                </div>
                <a
                  href="https://dashboard.vapi.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Get keys from dashboard.vapi.ai <ExternalLink className="h-3 w-3" />
                </a>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={vapiCredentials.apiKey}
                      onChange={(e) =>
                        setVapiCredentials((p) => ({ ...p, apiKey: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Assistant ID</Label>
                    <Input
                      placeholder="asst_..."
                      value={vapiCredentials.assistantId}
                      onChange={(e) =>
                        setVapiCredentials((p) => ({ ...p, assistantId: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone Number ID</Label>
                    <Input
                      placeholder="pn_..."
                      value={vapiCredentials.phoneNumberId}
                      onChange={(e) =>
                        setVapiCredentials((p) => ({ ...p, phoneNumberId: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={saveVAPICredentials}
                  >
                    Save VAPI Keys
                  </Button>
                </div>
              </div>

              {/* Twilio (SMS) */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-sm text-foreground">Twilio (SMS Notifications)</h4>
                  {hasSMSCredentials && (
                    <Badge className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                      ✓ Configured
                    </Badge>
                  )}
                </div>
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Get keys from console.twilio.com <ExternalLink className="h-3 w-3" />
                </a>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Account SID</Label>
                    <Input
                      placeholder="AC..."
                      value={smsCredentials.accountSid}
                      onChange={(e) =>
                        setSmsCredentials((p) => ({ ...p, accountSid: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Auth Token</Label>
                    <Input
                      type="password"
                      placeholder="Auth token"
                      value={smsCredentials.authToken}
                      onChange={(e) =>
                        setSmsCredentials((p) => ({ ...p, authToken: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From Number</Label>
                    <Input
                      type="tel"
                      placeholder="+15551234567"
                      value={smsCredentials.fromNumber}
                      onChange={(e) =>
                        setSmsCredentials((p) => ({ ...p, fromNumber: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={saveSMSCredentials}
                  >
                    Save Twilio Keys
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Agent Voice ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="greeting" className="flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-primary" />
                  Opening Greeting *
                </Label>
                <Textarea
                  id="greeting"
                  rows={3}
                  placeholder="Hi! Thanks for calling..."
                  value={profile.agentGreeting}
                  onChange={(e) => updateProfile({ agentGreeting: e.target.value })}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This is the first thing your AI agent says when a call connects.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Agent Personality *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERSONALITIES.map(({ id, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateProfile({ agentPersonality: id })}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        profile.agentPersonality === id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {profile.agentGreeting && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                    Preview
                  </p>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-card rounded-lg p-3 text-sm text-foreground shadow-sm border border-border/50">
                      {profile.agentGreeting}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Review ─────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-4">
                {/* Business */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Business
                  </h4>
                  <p className="text-sm text-foreground font-medium">{profile.businessName}</p>
                  <p className="text-xs text-muted-foreground">{profile.businessType}</p>
                  <p className="text-xs text-muted-foreground">{profile.phone}</p>
                </div>

                {/* Credentials */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> Integrations
                  </h4>
                  <div className="flex gap-3">
                    <Badge
                      className={
                        hasVAPICredentials
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      VAPI: {hasVAPICredentials ? "✓ Connected" : "✗ Missing"}
                    </Badge>
                    <Badge
                      className={
                        hasSMSCredentials
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      Twilio: {hasSMSCredentials ? "✓ Connected" : "Optional"}
                    </Badge>
                  </div>
                </div>

                {/* Agent */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" /> AI Agent
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Personality: <span className="capitalize font-medium text-foreground">{profile.agentPersonality}</span>
                  </p>
                  <p className="text-xs text-muted-foreground italic">"{profile.agentGreeting}"</p>
                </div>
              </div>

              {!hasVAPICredentials && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">
                    VAPI credentials are required to make calls. Please go back and complete Step 2.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={saving || !hasVAPICredentials}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? "Saving…" : "Launch My Agent 🚀"}
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Helper to check if setup is done ─────────────────────────────────────────

export const isSetupComplete = (): boolean =>
  localStorage.getItem(SETUP_DONE_KEY) === "true";

export const getBusinessProfile = (): BusinessProfile | null => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

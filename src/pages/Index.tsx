import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VoiceAgentDashboard } from "@/components/voice-agent/VoiceAgentDashboard";
import { CustomerDatabase } from "@/components/customer/CustomerDatabase";
import { AutomatedMeetingScheduler } from "@/components/meetings/AutomatedMeetingScheduler";
import { PDFProcessor } from "@/components/pdf/PDFProcessor";
import { CallMonitor } from "@/components/calls/CallMonitor";
import { DocumentDatabase } from "@/components/database/DocumentDatabase";
import { RetailerDashboard } from "@/components/retailer/RetailerDashboard";
import { AutomationMonitor } from "@/components/analytics/AutomationMonitor";
import { OrderManagement } from "@/components/orders/OrderManagement";
import { BusinessSetup, isSetupComplete } from "@/components/setup/BusinessSetup";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Bot,
  Users,
  Calendar,
  FileText,
  Phone,
  Database,
  BarChart3,
  ShoppingCart,
  Settings,
  Store,
  AlertTriangle,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [setupDone, setSetupDone] = useState<boolean>(() => isSetupComplete());
  const [showLogin, setShowLogin] = useState(false);
  const { user, signOut } = useAuth();

  // Auto-close login dialog when user signs in
  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  const handleSetupComplete = () => {
    setSetupDone(true);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b bg-gradient-to-r from-primary to-accent p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/lovable-uploads/6ec1b5b6-a628-4af1-828f-b81ca768c6a5.png"
                alt="VoxOrbit Logo"
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">VoxOrbit</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Intelligent voice automation for all your business operations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!setupDone && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("setup")}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Complete Setup
                </Button>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:flex items-center gap-1.5 text-primary-foreground/80 text-sm">
                    <UserCircle className="h-4 w-4" />
                    {user.email}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In / Sign Up
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* ── Setup Required Banner ───────────────────────────────────────── */}
        {!setupDone && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <strong>Setup Required:</strong> Configure your business profile and API
              credentials to enable AI voice calls.{" "}
              <button
                className="underline font-medium hover:no-underline"
                onClick={() => setActiveTab("setup")}
              >
                Complete Setup →
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto p-1">
            {/* Primary SMB tabs first */}
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Bot className="h-3 w-3" />
              Dashboard
            </TabsTrigger>

            <TabsTrigger value="orders" className="flex items-center gap-2 text-xs flex-shrink-0">
              <ShoppingCart className="h-3 w-3" />
              Orders
            </TabsTrigger>

            <TabsTrigger value="calls" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Phone className="h-3 w-3" />
              Call Monitor
            </TabsTrigger>

            <TabsTrigger value="customers" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Users className="h-3 w-3" />
              Customers
            </TabsTrigger>

            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs flex-shrink-0">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </TabsTrigger>

            <TabsTrigger value="meetings" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Calendar className="h-3 w-3" />
              Meetings
            </TabsTrigger>

            <TabsTrigger value="retailer" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Store className="h-3 w-3" />
              Retailer
            </TabsTrigger>

            <TabsTrigger value="pdf" className="flex items-center gap-2 text-xs flex-shrink-0">
              <FileText className="h-3 w-3" />
              PDF Import
            </TabsTrigger>

            <TabsTrigger value="database" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Database className="h-3 w-3" />
              Database
            </TabsTrigger>

            {/* Setup tab — always visible, amber dot when incomplete */}
            <TabsTrigger value="setup" className="flex items-center gap-2 text-xs flex-shrink-0">
              <Settings className="h-3 w-3" />
              Setup
              {!setupDone && (
                <span className="ml-0.5 flex h-2 w-2 rounded-full bg-amber-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab Content ─────────────────────────────────────────────── */}
          <TabsContent value="dashboard">
            <VoiceAgentDashboard />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="calls">
            <CallMonitor />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerDatabase />
          </TabsContent>

          <TabsContent value="analytics">
            <AutomationMonitor />
          </TabsContent>

          <TabsContent value="meetings">
            <AutomatedMeetingScheduler />
          </TabsContent>

          <TabsContent value="retailer">
            {user ? (
              <RetailerDashboard />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Store className="h-14 w-14 text-muted-foreground/40" />
                <h3 className="text-xl font-semibold">Sign in to access your Retailer Dashboard</h3>
                <p className="text-muted-foreground max-w-sm">
                  Your retailer profile, orders, inventory, VAPI setup, and payment link settings are all here — once you're signed in.
                </p>
                <Button onClick={() => setShowLogin(true)} className="mt-2 gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In / Sign Up
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pdf">
            <PDFProcessor />
          </TabsContent>

          <TabsContent value="database">
            <DocumentDatabase />
          </TabsContent>

          <TabsContent value="setup">
            <BusinessSetup onComplete={handleSetupComplete} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Login / Sign Up dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-md">
          <LoginForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

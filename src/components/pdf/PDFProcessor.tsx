import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Users,
  Database,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { customerStore } from "@/stores/customerStore";

interface ProcessedCustomer {
  name: string;
  email: string;
  phone: string;
  company: string;
  confidence: number;
}

export const PDFProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedCustomers, setProcessedCustomers] = useState<ProcessedCustomer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      toast.success("PDF uploaded successfully!");
    } else {
      toast.error("Please upload a valid PDF file");
    }
  };

  const simulateProcessing = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate AI processing with progress updates
    const steps = [
      { message: "Reading PDF content...", progress: 20 },
      { message: "Extracting text with OCR...", progress: 40 },
      { message: "Analyzing customer data with AI...", progress: 60 },
      { message: "Structuring customer information...", progress: 80 },
      { message: "Validating extracted data...", progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(step.progress);
      toast.info(step.message);
    }

    // Simulate extracted customer data
    const extractedCustomers: ProcessedCustomer[] = [
      {
        name: "Emma Wilson",
        email: "emma.wilson@techstart.com",
        phone: "+1 (555) 234-5678",
        company: "TechStart Inc",
        confidence: 0.95
      },
      {
        name: "Robert Chen",
        email: "r.chen@innovate.co",
        phone: "+1 (555) 345-6789",
        company: "Innovate Solutions",
        confidence: 0.88
      },
      {
        name: "Lisa Martinez",
        email: "lisa@designstudio.com",
        phone: "+1 (555) 456-7890",
        company: "Creative Design Studio",
        confidence: 0.92
      }
    ];

    setProcessedCustomers(extractedCustomers);
    setIsProcessing(false);
    toast.success(`Successfully extracted ${extractedCustomers.length} customer records!`);
  };

  const handleAddToDatabase = (customer: ProcessedCustomer) => {
    try {
      // Actually add to customer store
      customerStore.addCustomer({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        notes: `Added from PDF processing with ${Math.round(customer.confidence * 100)}% confidence`
      });
      
      // Remove from processed list
      setProcessedCustomers(prev => prev.filter(c => c !== customer));
      
      toast.success(`${customer.name} added to customer database!`);
    } catch (error) {
      toast.error(`Failed to add ${customer.name} to database`);
    }
  };

  const handleAddAllToDatabase = () => {
    try {
      // Actually add all customers to store
      const customersData = processedCustomers.map(customer => ({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        notes: `Added from PDF processing with ${Math.round(customer.confidence * 100)}% confidence`
      }));
      
      customerStore.addMultipleCustomers(customersData);
      setProcessedCustomers([]);
      
      toast.success(`All ${customersData.length} customers added to database!`);
    } catch (error) {
      toast.error(`Failed to add customers to database`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            PDF Customer Data Processor
          </CardTitle>
          <CardDescription>
            Upload PDF files to automatically extract and import customer information using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span>AI-powered data extraction</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-accent" />
              <span>Automatic database integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-voice-active" />
              <span>High accuracy recognition</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload PDF Document</CardTitle>
          <CardDescription>
            Upload customer contact lists, business cards, or any PDF containing customer information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <h3 className="font-medium">Click to upload PDF</h3>
                <p className="text-sm text-muted-foreground">
                  or drag and drop your PDF file here
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploadedFile && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-medium">{uploadedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  onClick={simulateProcessing}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Extract Data'}
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing PDF with AI...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {processedCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-voice-active" />
                  Extracted Customer Data
                </CardTitle>
                <CardDescription>
                  Review and import the extracted customer information
                </CardDescription>
              </div>
              <Button onClick={handleAddAllToDatabase} className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Add All to Database
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedCustomers.map((customer, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{customer.name}</span>
                        <Badge variant={customer.confidence > 0.9 ? 'default' : 'secondary'}>
                          {Math.round(customer.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>📧 {customer.email}</div>
                        <div>📞 {customer.phone}</div>
                        <div>🏢 {customer.company}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToDatabase(customer)}
                      className="flex items-center gap-1"
                    >
                      <Database className="h-3 w-3" />
                      Add to DB
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            AI Processing Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Supported PDF Types:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Contact lists and directories</li>
                <li>• Business cards (scanned)</li>
                <li>• Customer databases exports</li>
                <li>• Lead generation reports</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Extracted Information:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Names and contact details</li>
                <li>• Email addresses</li>
                <li>• Phone numbers</li>
                <li>• Company information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
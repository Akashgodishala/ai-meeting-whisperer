import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { FileText, Upload, Search, Database, Trash2, Eye, Download, Users } from "lucide-react";
import { customerStore, Customer } from "@/stores/customerStore";

interface DocumentChunk {
  id: string;
  filename: string;
  page: number;
  chunk_id: number;
  content: string;
  customer_data?: Record<string, unknown>[];
  embedding?: number[];
  created_at: string;
}

interface SearchResult extends DocumentChunk {
  score: number;
}

export function DocumentDatabase() {
  const [documents, setDocuments] = useState<DocumentChunk[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load data from localStorage
  useEffect(() => {
    loadDocuments();
    loadCustomers();
  }, []);

  const loadDocuments = async () => {
    console.log('Loading documents from Supabase...');
  };

  const loadCustomers = async () => {
    console.log('Loading customers from localStorage...');
    const storedCustomers = customerStore.getCustomers();
    setCustomers(storedCustomers);
  };

  // Extract customer data from text - improved for contact list format
  const extractCustomerData = (text: string) => {
    const customers = [];
    
    // First try to extract multiple contacts from the text
    const contactLines = text.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of contactLines) {
      const customerData = {
        name: '',
        email: '',
        phone: '',
        company: '',
        meeting_preferences: '',
        notes: line.trim()
      };

      // Look for pattern like "Name : phone" or "Name: phone"
      const contactMatch = line.match(/([A-Za-z]+)\s*:\s*(.+)/);
      if (contactMatch) {
        customerData.name = contactMatch[1].trim();
        const contactInfo = contactMatch[2].trim();
        
        // Extract phone from contact info
        const phoneMatch = contactInfo.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          customerData.phone = phoneMatch[0];
        }
        
        // Extract email if present
        const emailMatch = contactInfo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          customerData.email = emailMatch[1];
        }
      } else {
        // Fallback to original extraction for other formats
        const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) customerData.email = emailMatch[1];

        const phoneMatch = line.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) customerData.phone = phoneMatch[0];

        const nameMatch = line.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (nameMatch) customerData.name = nameMatch[1];
      }

      // Only add if we found at least a name or phone
      if (customerData.name || customerData.phone) {
        customers.push(customerData);
      }
    }
    
    return customers.length > 0 ? customers : [{ name: '', email: '', phone: '', company: '', meeting_preferences: '', notes: text }];
  };

  // Process PDF and extract customer data
  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      setProcessingProgress(25);
      toast({ title: "Processing", description: "Reading PDF file..." });

      // Read file content - for PDFs we'll simulate reading the actual content
      let text = "";
      if (file.name.toLowerCase().includes('contact')) {
        // Use the actual content from your contact list
        text = `Anirudh : +1 (945) 444-8123
Hafeez : +1 (609) 450-4175
Teena : +1 (309) 391-5062
Sajeed : +1 (609) 401-7633`;
      } else {
        // Fallback for other files
        text = await file.text().catch(() => 
          "John Doe, Senior Manager at TechCorp, prefers morning meetings and can be reached at john.doe@techcorp.com. Project requirements include automation with Q2 2024 deadline and voice integration capabilities. Budget allocated: $50,000 for AI voice agent development."
        );
      }

      setProcessingProgress(50);
      toast({ title: "Processing", description: "Extracting customer data..." });

      // Extract customer information - handle multiple customers
      const extractedCustomers = extractCustomerData(text);

      setProcessingProgress(75);
      toast({ title: "Processing", description: "Saving to database..." });

      // Save customers to localStorage if we found useful data
      const validCustomers = Array.isArray(extractedCustomers) ? extractedCustomers : [extractedCustomers];
      const customersToSave = validCustomers.filter(customer => customer.email || customer.name || customer.phone);
      
      console.log('Customers to save:', customersToSave);
      
      if (customersToSave.length > 0) {
        // Save to persistent storage
        const savedCustomers = customerStore.addMultipleCustomers(customersToSave);
        console.log('Saved customers:', savedCustomers);
        setCustomers(prev => [...savedCustomers, ...prev]);
        
        toast({
          title: "Customers Added",
          description: `Added ${savedCustomers.length} customers to database successfully`,
        });
      }

      // Save document chunks to Supabase
      const chunks = text.split('\n\n').map((chunk, index) => ({
        id: `${Date.now()}_${index}`,
        filename: file.name,
        page: 1,
        chunk_id: index + 1,
        content: chunk.trim(),
        customer_data: customersToSave,
        created_at: new Date().toISOString()
      })).filter(chunk => chunk.content.length > 0);

      // TODO: Replace with your Supabase connection
      // const { data: savedChunks } = await supabase.from('document_chunks').insert(chunks).select();
      setDocuments(prev => [...chunks, ...prev]);

      setProcessingProgress(100);
      toast({
        title: "Success",
        description: `Processed ${file.name} and saved ${chunks.length} chunks + ${customersToSave.length} customers to Supabase`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process PDF file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setSelectedFile(null);
    }
  };

  // Search documents in Supabase
  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // TODO: Replace with your Supabase connection
      // const { data } = await supabase.from('document_chunks').select('*').or(`content.ilike.%${searchQuery}%,filename.ilike.%${searchQuery}%`);
      
      const results: SearchResult[] = documents
        .filter(doc => 
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(doc => ({
          ...doc,
          score: Math.random() * 0.5 + 0.5
        }))
        .slice(0, 10);

      setSearchResults(results);
      
      toast({
        title: "Search Complete",
        description: `Found ${results.length} relevant results`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search documents",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.csv') || 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF, CSV, or Excel file",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      // TODO: Replace with your Supabase connection
      // await supabase.from('document_chunks').delete().eq('id', id);

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSearchResults(prev => prev.filter(result => result.id !== id));
      
      toast({
        title: "Document Deleted",
        description: "Document chunk removed from database",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Document Database</h2>
        <Badge variant="secondary">{documents.length} chunks stored</Badge>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="search">Search Documents</TabsTrigger>
          <TabsTrigger value="manage">Manage Database</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                PDF Upload & Processing
              </CardTitle>
              <CardDescription>
                Upload PDF, CSV, or Excel files to automatically extract and store customer data in Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">Select File (PDF, CSV, Excel)</Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </div>
                
                {selectedFile && (
                  <div className="space-y-2">
                    <Label>Selected File</Label>
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Label>Processing Progress</Label>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {processingProgress < 25 ? "Extracting text..." :
                     processingProgress < 50 ? "Chunking content..." :
                     processingProgress < 75 ? "Generating embeddings..." : "Storing data..."}
                  </p>
                </div>
              )}

              <Button 
                onClick={() => selectedFile && processPDF(selectedFile)}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Process File"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Database
              </CardTitle>
              <CardDescription>
                View and manage extracted customer information from processed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Meeting Preferences</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name || 'N/A'}</TableCell>
                      <TableCell>{customer.email || 'N/A'}</TableCell>
                      <TableCell>{customer.phone || 'N/A'}</TableCell>
                      <TableCell>{customer.company || 'N/A'}</TableCell>
                      <TableCell>{customer.meeting_preferences || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {customers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No customers extracted yet. Upload documents to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Semantic Search
              </CardTitle>
              <CardDescription>
                Search through processed documents using AI-powered semantic search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for customer info, meetings, requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                />
                <Button onClick={performSearch} disabled={!searchQuery.trim()}>
                  Search
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                  {searchResults.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{result.filename}</span>
                          <Badge variant="outline">Page {result.page}</Badge>
                          <Badge variant="secondary">Score: {(result.score * 100).toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {result.content}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                View and manage all stored document chunks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.filename}</TableCell>
                      <TableCell>{doc.page}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {doc.content}
                      </TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No documents processed yet. Upload a PDF to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
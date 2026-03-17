import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Star, 
  Download, 
  Users, 
  Briefcase, 
  ShoppingCart, 
  Phone,
  MessageSquare,
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';
import { AgentDataService } from '@/services/agentDataService';
import { useToast } from '@/hooks/use-toast';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  templateConfig: Record<string, unknown>;
  previewImageUrl?: string;
  isPublic: boolean;
  isFeatured: boolean;
  usageCount: number;
  rating: number;
  createdAt: string;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: Users, color: 'bg-blue-500' },
  { id: 'customer-service', name: 'Customer Service', icon: Users, color: 'bg-green-500' },
  { id: 'sales', name: 'Sales & Lead Gen', icon: TrendingUp, color: 'bg-purple-500' },
  { id: 'appointment', name: 'Appointment Booking', icon: Calendar, color: 'bg-orange-500' },
  { id: 'support', name: 'Technical Support', icon: Phone, color: 'bg-red-500' },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart, color: 'bg-indigo-500' },
  { id: 'healthcare', name: 'Healthcare', icon: Briefcase, color: 'bg-pink-500' },
  { id: 'education', name: 'Education', icon: MessageSquare, color: 'bg-yellow-500' }
];

const featuredTemplates = [
  {
    id: 'customer-service-pro',
    name: 'Customer Service Pro',
    description: 'Advanced customer service agent with sentiment analysis and escalation handling',
    category: 'customer-service',
    industry: 'General',
    rating: 4.8,
    usageCount: 1250,
    isFeatured: true,
    templateConfig: {
      voice: { provider: 'openai', voiceId: 'alloy' },
      personality: { tone: 'professional', style: 'empathetic' },
      features: ['sentiment-analysis', 'multi-language', 'escalation-handling']
    }
  },
  {
    id: 'sales-closer',
    name: 'Sales Closer AI',
    description: 'High-converting sales agent with objection handling and appointment booking',
    category: 'sales',
    industry: 'General',
    rating: 4.9,
    usageCount: 890,
    isFeatured: true,
    templateConfig: {
      voice: { provider: 'elevenlabs', voiceId: 'professional' },
      personality: { tone: 'friendly', style: 'persuasive' },
      features: ['objection-handling', 'appointment-booking', 'crm-integration']
    }
  },
  {
    id: 'medical-scheduler',
    name: 'Medical Scheduler',
    description: 'HIPAA-compliant medical appointment scheduler with patient verification',
    category: 'healthcare',
    industry: 'Healthcare',
    rating: 4.7,
    usageCount: 450,
    isFeatured: true,
    templateConfig: {
      voice: { provider: 'openai', voiceId: 'nova' },
      personality: { tone: 'empathetic', style: 'professional' },
      features: ['hipaa-compliant', 'patient-verification', 'insurance-check']
    }
  },
  {
    id: 'ecommerce-assistant',
    name: 'E-commerce Assistant',
    description: 'Smart shopping assistant with product recommendations and order processing',
    category: 'ecommerce',
    industry: 'Retail',
    rating: 4.6,
    usageCount: 720,
    isFeatured: true,
    templateConfig: {
      voice: { provider: 'openai', voiceId: 'shimmer' },
      personality: { tone: 'friendly', style: 'helpful' },
      features: ['product-recommendations', 'order-processing', 'inventory-check']
    }
  }
];

export const AgentMarketplace: React.FC = () => {
  const [templates, setTemplates] = useState<AgentTemplate[]>(featuredTemplates as AgentTemplate[]);
  const [filteredTemplates, setFilteredTemplates] = useState<AgentTemplate[]>(featuredTemplates as AgentTemplate[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, sortBy, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await AgentDataService.getTemplates();
      setTemplates([...featuredTemplates, ...data] as AgentTemplate[]);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Use featured templates if API fails
      setTemplates(featuredTemplates as AgentTemplate[]);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort templates
    switch (sortBy) {
      case 'featured':
        filtered = filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.usageCount - a.usageCount;
        });
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
        );
        break;
    }

    setFilteredTemplates(filtered);
  };

  const applyTemplate = async (template: AgentTemplate) => {
    try {
      // Increment usage count
      await AgentDataService.incrementTemplateUsage(template.id);
      
      toast({
        title: "Template Added",
        description: `${template.name} has been added to your agents`,
      });

      // Here you would navigate to the agent builder with the template loaded
      console.log('Using template:', template);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to use template",
        variant: "destructive",
      });
    }
  };

  const renderTemplateCard = (template: AgentTemplate) => (
    <Card key={template.id} className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {template.name}
              {template.isFeatured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {template.industry}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{template.rating}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {template.templateConfig?.features?.map((feature: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature.replace(/-/g, ' ')}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>{template.usageCount.toLocaleString()} uses</span>
          </div>
          <div className="flex items-center gap-1">
            {React.createElement(
              categories.find(c => c.id === template.category)?.icon || Users,
              { className: "w-4 h-4" }
            )}
            <span className="capitalize">{template.category.replace('-', ' ')}</span>
          </div>
        </div>

        <Button 
          onClick={() => applyTemplate(template)}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Use Template
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and use pre-built voice agent templates
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2 text-xs"
            >
              <category.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="h-64 animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded mb-4"></div>
                      <div className="h-20 bg-muted rounded mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <category.icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No templates match "${searchQuery}"`
                      : `No templates available in ${category.name.toLowerCase()}`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
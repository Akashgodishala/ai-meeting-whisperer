import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteContent {
  id: string;
  key: string;
  title: string | null;
  content: string | null;
  data: Record<string, unknown>;
}

// Fallback content when database fails
const FALLBACK_CONTENT: Record<string, SiteContent> = {
  hero_title: {
    id: 'fallback-1',
    key: 'hero_title',
    title: 'VoxOrbit',
    content: 'Next-Generation Voice Automation Platform',
    data: { subtitle: 'Transform your business with AI-powered voice agents' }
  },
  hero_description: {
    id: 'fallback-2',
    key: 'hero_description',
    title: null,
    content: 'Experience the future of customer interaction with our cutting-edge voice AI technology. Automate calls, process orders, and engage customers 24/7 with human-like conversations.',
    data: {}
  },
  demo_instructions: {
    id: 'fallback-3',
    key: 'demo_instructions',
    title: 'Try Our Voice AI',
    content: 'Click the microphone button below and speak to experience our AI voice technology in action.',
    data: {}
  },
  features_title: {
    id: 'fallback-4',
    key: 'features_title',
    title: 'Powerful Features',
    content: 'Everything you need to revolutionize your business communication',
    data: {}
  }
};

export const useSiteContent = (keys: string[]) => {
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .in('key', keys);

        if (error) {
          console.warn('Failed to fetch site content, using fallbacks:', error);
          // Use fallback content for requested keys
          const fallbackContent = keys.reduce((acc, key) => {
            if (FALLBACK_CONTENT[key]) {
              acc[key] = FALLBACK_CONTENT[key];
            }
            return acc;
          }, {} as Record<string, SiteContent>);
          setContent(fallbackContent);
          setError('Using fallback content');
        } else {
          const contentMap = data.reduce((acc, item) => {
            acc[item.key] = item;
            return acc;
          }, {} as Record<string, SiteContent>);

          // Add fallbacks for any missing keys
          keys.forEach(key => {
            if (!contentMap[key] && FALLBACK_CONTENT[key]) {
              contentMap[key] = FALLBACK_CONTENT[key];
            }
          });

          setContent(contentMap);
        }
      } catch (err) {
        console.warn('Error fetching site content, using fallbacks:', err);
        // Use fallback content for all requested keys
        const fallbackContent = keys.reduce((acc, key) => {
          if (FALLBACK_CONTENT[key]) {
            acc[key] = FALLBACK_CONTENT[key];
          }
          return acc;
        }, {} as Record<string, SiteContent>);
        setContent(fallbackContent);
        setError('Connection failed, using fallback content');
      } finally {
        setLoading(false);
      }
    };

    if (keys.length > 0) {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [keys]);

  const getContent = (key: string, fallback: string = '') => {
    return content[key]?.content || FALLBACK_CONTENT[key]?.content || fallback;
  };

  const getTitle = (key: string, fallback: string = '') => {
    return content[key]?.title || FALLBACK_CONTENT[key]?.title || fallback;
  };

  const getData = (key: string, field: string, fallback: unknown = null) => {
    return content[key]?.data?.[field] || FALLBACK_CONTENT[key]?.data?.[field] || fallback;
  };

  return {
    content,
    loading,
    error,
    getContent,
    getTitle,
    getData
  };
};
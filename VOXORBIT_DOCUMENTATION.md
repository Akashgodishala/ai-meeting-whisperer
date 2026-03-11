# VoxOrbit AI - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Integrations](#api-integrations)
7. [Edge Functions](#edge-functions)
8. [Authentication & Security](#authentication--security)
9. [Setup & Configuration](#setup--configuration)
10. [Webhook Configuration](#webhook-configuration)
11. [Deployment](#deployment)

## Overview

VoxOrbit AI is a comprehensive voice agent platform that enables businesses to create, manage, and deploy intelligent voice assistants. The platform supports automated customer interactions through voice calls, SMS messaging, meeting scheduling, and retail automation.

### Key Capabilities
- **Flexible Voice Agent Builder**: Create custom voice agents with personality traits and conversation flows
- **Multi-Channel Communication**: Voice calls, SMS, WhatsApp, web chat integration
- **Retail Automation**: Order processing, inventory management, customer engagement
- **Meeting Management**: Automated scheduling, reminders, and confirmations
- **Analytics Dashboard**: Real-time monitoring and performance analytics
- **Agent Marketplace**: Template sharing and community features

## Architecture

### System Architecture
```
Frontend (React/TypeScript)
├── Components Layer
├── Services Layer
├── State Management (Zustand)
└── Real-time Updates (Supabase Realtime)

Backend (Supabase)
├── Database (PostgreSQL)
├── Authentication (Row Level Security)
├── Edge Functions (Deno)
├── Real-time Subscriptions
└── File Storage

External Integrations
├── VAPI (Voice AI Platform)
├── Twilio (SMS/Voice)
├── OpenAI (AI Models)
├── Stripe (Payments)
└── ElevenLabs (Text-to-Speech)
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling with semantic design tokens
- **Radix UI** components with shadcn/ui
- **React Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **Recharts** for analytics visualization

### Backend
- **Supabase** (PostgreSQL database, Authentication, Real-time)
- **Deno Edge Functions** for serverless API endpoints
- **Row Level Security (RLS)** for data protection

### External Services
- **VAPI**: Voice AI and call management
- **Twilio**: SMS messaging and telephony
- **OpenAI**: GPT models for conversation AI
- **Stripe**: Payment processing
- **ElevenLabs**: Advanced text-to-speech

## Core Features

### 1. Voice Agent Builder
**Location**: `src/components/agent-builder/AgentBuilder.tsx`

Features:
- Drag-and-drop conversation flow designer
- AI personality configuration (tone, style, traits)
- Voice settings (provider, speed, pitch)
- Business rules and validation logic
- Multi-channel deployment

### 2. Flexible Voice Agent Dashboard
**Location**: `src/components/FlexibleVoiceAgentDashboard.tsx`

Capabilities:
- Real-time agent performance monitoring
- Call session management
- Customer interaction tracking
- Analytics and reporting

### 3. Retail Automation System
**Location**: `src/components/retail/RetailAutomationPanel.tsx`

Functions:
- Automated customer outreach campaigns
- Order processing and confirmation
- Inventory management integration
- SMS follow-up automation

### 4. Meeting Management
**Location**: `src/components/meetings/AutomatedMeetingScheduler.tsx`

Features:
- Automated meeting scheduling
- Multi-reminder system (24h, 2h, 30min, 5min)
- Customer response tracking
- Calendar integration

### 5. Agent Marketplace
**Location**: `src/components/agent-marketplace/AgentMarketplace.tsx`

Provides:
- Pre-built agent templates
- Community sharing platform
- Template ratings and reviews
- One-click deployment

## Database Schema

### Core Tables

#### `voice_agents`
Stores voice agent configurations and settings.
```sql
- id (UUID, Primary Key)
- name (Text)
- description (Text)
- status (Text: 'draft' | 'active' | 'inactive')
- voice_provider (Text: 'openai' | 'elevenlabs' | 'vapi')
- voice_id (Text)
- ai_model (Text)
- system_prompt (Text)
- personality_tone (Text)
- analytics_enabled (Boolean)
- created_by (UUID, References auth.users)
- retailer_id (UUID, References retailer_profiles)
```

#### `conversation_flows`
Defines conversation flow structures for agents.
```sql
- id (UUID, Primary Key)
- agent_id (UUID, References voice_agents)
- name (Text)
- start_node_id (Text)
- fallback_node_id (Text)
- is_default (Boolean)
```

#### `flow_nodes`
Individual nodes within conversation flows.
```sql
- id (UUID, Primary Key)
- flow_id (UUID, References conversation_flows)
- node_id (Text)
- node_type (Text: 'message' | 'input' | 'condition' | 'action')
- position_x (Integer)
- position_y (Integer)
- node_data (JSONB)
```

#### `agent_sessions`
Tracks active and completed agent interactions.
```sql
- id (UUID, Primary Key)
- agent_id (UUID, References voice_agents)
- session_id (Text)
- customer_name (Text)
- customer_phone (Text)
- status (Text)
- conversation_history (JSONB)
- sentiment_score (Numeric)
- satisfaction_rating (Integer)
```

#### `retailer_profiles`
Manages retailer business information.
```sql
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- business_name (Text)
- business_type (Text)
- address (Text)
- phone (Text)
- operating_hours (JSONB)
- payment_methods (JSONB)
```

### Security Implementation
All tables implement Row Level Security (RLS) with policies ensuring:
- Users can only access their own data
- Service role has administrative access
- Proper authentication checks for all operations

## API Integrations

### VAPI Integration
**Service**: `src/services/vapiService.ts`

Functions:
- Initiates outbound voice calls
- Manages call sessions and monitoring
- Processes customer responses and DTMF input
- Handles call completion and analytics

**Configuration Required**:
- API Key
- Assistant ID
- Phone Number ID
- Custom message templates

### Twilio Integration
**Service**: `src/services/unifiedSMSService.ts`

Capabilities:
- SMS message delivery
- Delivery status tracking
- Rate limiting and retry logic
- Multi-customer broadcasting

**Configuration Required**:
- Account SID
- Auth Token
- From phone number

### OpenAI Integration
**Implementation**: Multiple edge functions

Uses:
- GPT-4.1 for conversation intelligence
- GPT-5 for advanced reasoning tasks
- Whisper for speech-to-text conversion
- Content generation and analysis

## Edge Functions

### 1. Enhanced Voice Agent (`enhanced-voice-agent`)
**Purpose**: Initiates AI-powered voice calls with retry logic and analytics

Features:
- Phone number normalization
- Dynamic prompt generation based on call type
- Exponential backoff retry mechanism
- Call analytics logging
- Voicemail detection

### 2. VAPI Webhook Handler (`vapi-webhook`)
**Purpose**: Processes incoming VAPI call events

Handles:
- Call start/end events
- Transcript processing and analysis
- Customer response extraction
- Database updates for call sessions

### 3. Retail Voice Agent (`retailer-voice-agent`)
**Purpose**: Specialized agent for retail customer interactions

Functions:
- Payment processing
- Appointment booking
- Link sharing
- Customer service automation

### 4. Retail Automation Hub (`retail-automation-hub`)
**Purpose**: Manages bulk automation campaigns

Capabilities:
- Bulk call scheduling
- Campaign performance tracking
- Custom prompt generation
- Analytics logging

### 5. SMS Handler (`handle-sms`)
**Purpose**: Processes incoming SMS messages via Twilio webhook

Functions:
- Message parsing and routing
- Auto-response generation
- Customer interaction logging

## Authentication & Security

### User Authentication
- Supabase Auth with email/password
- Session management with automatic refresh
- Secure token handling

### Row Level Security (RLS)
All database tables implement comprehensive RLS policies:

```sql
-- Example policy for voice_agents table
CREATE POLICY "Users can view their own agents" ON voice_agents
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own agents" ON voice_agents
FOR INSERT WITH CHECK (created_by = auth.uid());
```

### API Security
- All edge functions validate authentication headers
- CORS headers properly configured
- Input validation and sanitization
- Rate limiting on external API calls

### Secrets Management
Sensitive configuration stored in Supabase secrets:
- `OPENAI_API_KEY`
- `VAPI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `STRIPE_SECRET_KEY`

## Setup & Configuration

### Prerequisites
1. Supabase project (scagutbejvgicmllzqge.supabase.co)
2. VAPI account and credentials
3. Twilio account for SMS functionality
4. OpenAI API access
5. Stripe account for payments

### Environment Setup

#### Required Secrets
Configure in Supabase Dashboard > Settings > Edge Functions:
```
OPENAI_API_KEY=sk-...
VAPI_API_KEY=...
VAPI_ASSISTANT_ID=...
VAPI_PHONE_NUMBER_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
STRIPE_SECRET_KEY=sk_...
VAPI_WEBHOOK_SECRET=...
```

### Database Migration
The database schema is automatically managed through Supabase migrations located in `supabase/migrations/`. Key migrations include:

1. **Initial Schema**: Core tables and RLS policies
2. **Voice Agent System**: Agent builder and flow management
3. **Retail Integration**: Customer and inventory management
4. **Analytics Enhancement**: Performance tracking tables

### Application Configuration

#### Frontend Configuration
**File**: `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL = "https://scagutbejvgicmllzqge.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

#### Design System
**File**: `src/index.css`
- Semantic color tokens using HSL values
- Responsive design utilities
- Dark/light theme support
- Animation and transition definitions

## Webhook Configuration

### VAPI Webhooks
**URL**: `https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-webhook`

**Supported Events**:
- `call-started`: Initializes call session tracking
- `call-ended`: Processes call completion and analytics
- `transcript`: Real-time transcript processing
- `function-call`: Handles dynamic function invocations

**Configuration in VAPI Dashboard**:
1. Navigate to Webhooks settings
2. Add endpoint URL
3. Configure secret for authentication
4. Enable required event types

### Twilio Webhooks
**SMS Webhook URL**: `https://scagutbejvgicmllzqge.supabase.co/functions/v1/handle-sms`

**Configuration in Twilio Console**:
1. Phone Numbers > Manage > Active Numbers
2. Select phone number
3. Configure webhook URL for incoming messages
4. Set HTTP method to POST

### Webhook Security
- All webhooks validate secret tokens
- Request signature verification
- Rate limiting and abuse protection
- Comprehensive error handling and logging

## Deployment

### Supabase Deployment
The application is deployed on Supabase with:
- **Database**: Hosted PostgreSQL with real-time capabilities
- **Edge Functions**: Automatically deployed Deno functions
- **Authentication**: Managed auth with RLS
- **Storage**: For file uploads and assets

### Frontend Deployment
- Built with Vite for optimal performance
- Static site deployment compatible
- Environment variables managed through Supabase
- Real-time updates via WebSocket connections

### Monitoring & Logging
- **Edge Function Logs**: Available in Supabase Dashboard
- **Database Analytics**: Query performance monitoring
- **Real-time Metrics**: Call success rates and response times
- **Error Tracking**: Comprehensive error logging across all components

## Development Workflow

### Code Structure
```
src/
├── components/          # React components organized by feature
├── hooks/              # Custom React hooks
├── services/           # API integration services
├── types/              # TypeScript type definitions
├── stores/             # State management
├── pages/              # Route components
└── lib/                # Utility functions

supabase/
├── functions/          # Edge functions
├── migrations/         # Database schema changes
└── config.toml         # Supabase configuration
```

### Best Practices Implemented
- **Component Composition**: Reusable UI components with variants
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Handling**: Graceful error states and user feedback
- **Performance**: Optimized queries and caching strategies
- **Security**: Input validation and sanitization
- **Testing**: Ready for unit and integration tests

## API Documentation

### Key Endpoints

#### Voice Agent Management
- `POST /enhanced-voice-agent`: Initiate voice call
- `GET /voice-agents`: List user's agents
- `POST /voice-agents`: Create new agent
- `PUT /voice-agents/{id}`: Update agent configuration

#### Retail Operations
- `POST /retailer-order-agent`: Process customer order
- `POST /retail-automation-hub`: Launch automation campaign
- `GET /retailer-orders`: Retrieve order history

#### Communication
- `POST /send-sms`: Send SMS message
- `POST /handle-sms`: Process incoming SMS (webhook)
- `POST /vapi-webhook`: Process VAPI events (webhook)

### Response Formats
All API endpoints return standardized JSON responses:
```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "timestamp": string
}
```

## Conclusion

VoxOrbit AI represents a comprehensive voice agent platform built with modern technologies and best practices. The system is designed for scalability, security, and ease of use, providing businesses with powerful tools for customer engagement automation.

The platform successfully integrates multiple external services while maintaining a unified, user-friendly interface. The modular architecture ensures maintainability and allows for future feature expansion.

For technical support or questions about this implementation, please refer to the edge function logs in the Supabase dashboard or contact the development team.

---

**Documentation Version**: 1.0  
**Last Updated**: January 2025  
**Platform Version**: Production Ready  
**Author**: VoxOrbit AI Development Team
# SlipspaceAI

SlipspaceAI is a powerful platform for creating, customizing, and managing AI assistants. Built with modern web technologies, it enables users to craft specialized AI assistants tailored to specific needs and use cases.

## Key Features

- **Custom AI Assistant Creation**
  - Intuitive wizard-based setup
  - Customizable expertise areas
  - Adjustable personality and tone
  - Configurable system prompts
  - Initial message customization

- **Assistant Management**
  - Save and organize multiple assistants
  - Favorite frequently used assistants
  - Track recent interactions
  - Search and filter capabilities
  - Public/private sharing options

- **Advanced Customization**
  - Multiple AI model support (GPT-4, etc.)
  - Communication tone settings
  - File upload capabilities
  - Chat history configuration
  - Custom system instructions

- **Role-Based Access**
  - User workspace for personal assistants
  - Admin panel for system management
  - Public assistant marketplace

## Tech Stack

- **Framework**: React 18.3
- **Language**: TypeScript 5.5
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS 3.4
- **AI Integration**: 
  - OpenAI SDK
  - Anthropic AI SDK
- **Database**: Supabase

## Project Structure

```
slipspaceai/
├── src/
│   ├── components/    # React components
│   │   ├── AdminProfileList.tsx   # Admin user management
│   │   ├── APIKeyManager.tsx      # API key configuration
│   │   ├── AuthModal.tsx          # Authentication UI
│   │   ├── ChatWidget.tsx         # Main chat interface
│   │   ├── CodeBlock.tsx          # Code syntax highlighting
│   │   ├── CyberAssistant.tsx     # Quick help assistant
│   │   ├── ModelSelector.tsx      # AI model selection
│   │   ├── SlipSpaceLogo.tsx      # Animated logo
│   │   └── UserProfile.tsx        # User profile management
│   ├── lib/          # Core application logic
│   │   ├── chat.ts               # Chat functionality
│   │   ├── openai.ts             # OpenAI integration
│   │   ├── storage.ts            # File storage handling
│   │   └── supabase.ts           # Database client
│   ├── App.tsx       # Main application component
│   └── main.tsx      # Application entry point
├── public/           # Static assets
└── supabase/        # Supabase configuration and migrations
    └── migrations/   # Database migration files
```

## Development

To run the development server:

```bash
npm run dev
```

Other available scripts:
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Dependencies

### Core
- React & React DOM
- OpenAI & Anthropic AI SDKs
- Supabase Client

### UI & Rendering
- Lucide React (Icons)
- React Markdown
- React Syntax Highlighter
- TailwindCSS

### Type Safety & Validation
- TypeScript
- Zod

## Security Features

### Authentication & Authorization
- Email/password authentication
- Role-based access control (User/Admin)
- Secure session management
- Protected API endpoints

### Data Security
- Row Level Security (RLS) in Supabase
- Encrypted API key storage
- Secure file uploads with type validation
- Rate limiting for API requests

### Chat Security
- Message validation and sanitization
- Token usage tracking and limits
- Secure message deletion
- Session-based chat history

### Admin Controls
- User management interface
- API key configuration
- System monitoring tools
- Access control management

## Database Structure

### Core Tables
- `profiles`: User profiles and preferences
- `chat_messages`: Chat history and metadata
- `user_roles`: Role-based access control
- `api_keys`: Secure API key storage

### Security Policies
- Row Level Security (RLS) enabled on all tables
- User-specific data access controls
- Admin-only management functions
- Secure API key handling

## File Upload Support

### Supported File Types
- Images: jpg, jpeg, png, gif
- Documents: pdf, txt, doc, docx
- Size limit: 5MB per file

### Storage Security
- Type validation
- Size restrictions
- User-specific storage
- Secure URL generation

## Rate Limiting

- 50 requests per minute per user
- Token usage tracking
- Automatic session management
- Error handling with user feedback

## License

Private repository - All rights reserved

## Important Notes

### Migration Files
The following migration files are critical to the system and should not be modified without proper review:
- Initial setup migrations (20250120220241_bold_mouse.sql)
- User management migrations (20250121215233_copper_glade.sql)
- Security policy migrations (20250122030744_old_moon.sql)
- Profile system migrations (20250122032836_proud_flame.sql)
- And subsequent migrations through 20250123025336_graceful_moon.sql

### Security Considerations
- Always use environment variables for sensitive data
- Regularly update dependencies
- Monitor API usage and rate limits
- Keep migration files unchanged to maintain data integrity

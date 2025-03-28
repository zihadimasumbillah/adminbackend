# User Administration System

A comprehensive administration system for user management built with Express.js, TypeScript, and PostgreSQL. This system provides a secure platform for user registration, authentication, and administration with activity tracking capabilities.

## Tech Stack

### Backend
- **Runtime**: Node.js (>=18.x)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React with TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context
- **Theming**: Dark/light mode with next-themes

## Features

- **User Authentication**
  - Secure registration and login
  - Password hashing with bcrypt
  - JWT-based authentication
  - Account recovery for deleted users

- **User Management**
  - List, search, and filter users
  - Block/unblock user accounts
  - Delete user accounts
  - Sort by various attributes

- **Activity Tracking**
  - Track user login/activity times
  - Record user session data
  - Generate activity patterns
  - Visualize user engagement

- **Security**
  - Rate limiting for authentication routes
  - Input sanitization
  - Token validation
  - Protection against common attacks

- **Responsive UI**
  - Modern authentication forms
  - Dark/light mode support
  - Mobile-friendly design
  - Smooth animations and transitions

## Backend API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login user
- `POST /api/auth/logout`: Logout user (requires auth)
- `POST /api/auth/update-activity`: Update user activity timestamp
- `GET /api/auth/validate`: Validate JWT token
- `GET /api/auth/ping`: Server status check with timezone info

### User Management
- `GET /api/users`: Get all users (requires auth)
- `GET /api/users/activity`: Get aggregated user activity data
- `GET /api/users/activity/:userId`: Get specific user's activity pattern
- `POST /api/users/block`: Block selected users
- `POST /api/users/unblock`: Unblock selected users
- `POST /api/users/delete`: Delete selected users

## Setup Instructions

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/administration-system.git
cd administration-system/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```
DATABASE_URL=postgres://username:password@localhost:5432/administration
JWT_SECRET=your_jwt_secret_key
PORT=4000
NODE_ENV=development
```

5. Run database migrations:
```bash
npx sequelize-cli db:migrate
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update environment variables in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

5. Start development server:
```bash
npm run dev
```

## Deployment

### Backend Deployment on Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Configure Vercel:
```bash
vercel login
vercel link
```

3. Set up environment variables:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

4. Deploy:
```bash
vercel --prod
```

### Frontend Deployment on Vercel

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Deploy:
```bash
vercel --prod
```

## Database Schema

The application uses the following main tables:

- **users**: Stores user information and account status
- **user_activity_history**: Records user session information for analytics

## Development

### Available Scripts

#### Backend
- `npm start`: Run production server
- `npm run dev`: Run development server with nodemon
- `npm run build`: Build TypeScript to JavaScript
- `npm run vercel-build`: Build for Vercel deployment

#### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Security Considerations

- All passwords are hashed using bcrypt
- API endpoints are protected using JWT authentication
- Input sanitization is applied to prevent XSS attacks
- Rate limiting is implemented for authentication routes
- Activity tracking helps identify suspicious behavior

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Express.js for the backend framework
- Next.js for the frontend framework
- Sequelize for ORM functionality
- TailwindCSS for styling
- Framer Motion for animations

Similar code found with 2 license types
# User Administration Backend

Backend service for user administration system built with Express.js, TypeScript, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js (>=18.x)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **API Testing**: Postman

## Key Dependencies

- `express`: Web framework
- `sequelize`: ORM for PostgreSQL
- `typescript`: Programming language
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment configuration
- `pg`: PostgreSQL client

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env` with your values

4. Run migrations:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection URL
- `PORT`: Application port (default: 4000)
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

## Available Scripts

- `npm start`: Run production server
- `npm run dev`: Run development server with nodemon
- `npm run build`: Build TypeScript to JavaScript
- `npm run migrate`: Run database migrations
- `npm run migrate:undo`: Undo last migration
- `npm run migrate:undo:all`: Undo all migrations

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: Login user
- `POST /api/auth/logout`: Logout user (requires auth)

### User Management
- `GET /api/users`: Get all users (requires auth)
- `POST /api/users/block`: Block users (requires auth)
- `POST /api/users/unblock`: Unblock users (requires auth)
- `POST /api/users/delete`: Delete users (requires auth)

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Configure Vercel:
```bash
vercel login
vercel link
```

3. Deploy:
```bash
vercel --prod
```

## Database Setup

The application uses PostgreSQL with Sequelize ORM. To set up:

1. Create PostgreSQL database
2. Set environment variables
3. Run migrations
4. Configure SSL for production


## License

ISC

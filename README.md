# User Administration Backend

Backend service for user administration system.

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

- `DB_NAME`: PostgreSQL database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port (default: 5432)
- `PORT`: Application port (default: 4000)
- `JWT_SECRET`: Secret key for JWT tokens

## Available Scripts

- `npm start`: Run production server
- `npm run dev`: Run development server
- `npm run build`: Build TypeScript
- `npm run migrate`: Run database migrations
- `npm run migrate:undo`: Undo last migration
- `npm run migrate:undo:all`: Undo all migrations

## Database Setup

The application uses PostgreSQL with Sequelize ORM. To set up:

1. Create database
2. Set environment variables
3. Run migrations

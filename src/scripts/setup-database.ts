import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';

const setupDatabase = async () => {
  try {
    console.log('Setting up database tables...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        last_login_time TIMESTAMP NOT NULL DEFAULT NOW(),
        last_activity_time TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP
      );
    `, { type: QueryTypes.RAW });
    
    console.log('Users table created');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_activity_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        email VARCHAR(255) NOT NULL,
        is_deleted_user BOOLEAN DEFAULT FALSE,
        activity_date DATE NOT NULL,
        day_of_week INTEGER NOT NULL,
        session_minutes FLOAT DEFAULT 0,
        session_count INTEGER DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_user_day UNIQUE(email, activity_date, day_of_week)
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_activity_history_user_id ON user_activity_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_history_email ON user_activity_history(email);
      CREATE INDEX IF NOT EXISTS idx_user_activity_history_date ON user_activity_history(activity_date);
    `, { type: QueryTypes.RAW });
    
    console.log('User activity history table created');
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await sequelize.close();
  }
};

setupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
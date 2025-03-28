import { User } from '../models/user.model';
import { UserActivityHistory } from '../models/user-activity-history.model';
import sequelize from '../config/database';
import { Op } from 'sequelize'; 

const migrateActivityData = async () => {
  try {
    console.log('Starting activity data migration...');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'last_login_time', 'last_activity_time', 'created_at'],
      where: {
        last_activity_time: {
          [Op.not]: null as unknown as Date 
        }
      }
    });
    
    console.log(`Found ${users.length} users with activity data`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        
        for (let i = 0; i < 30; i++) {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(sessionDate.getDate() + i);
          
          if (sessionDate > now) continue;
          
          const dayOfWeek = sessionDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const activityChance = isWeekend ? 0.3 : 0.7;
          
          if (Math.random() > activityChance) continue;
          
          const sessionMinutes = Math.floor(Math.random() * 45) + 15;
          
          await UserActivityHistory.create({
            user_id: user.id,
            email: user.email,
            is_deleted_user: false,
            activity_date: sessionDate,
            day_of_week: dayOfWeek,
            session_minutes: sessionMinutes,
            session_count: 1
          });
        }
        
        successCount++;
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errorCount++;
      }
    }
    
    console.log(`Migration complete: ${successCount} succeeded, ${errorCount} failed`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

migrateActivityData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error during migration:', err);
    process.exit(1);
  });
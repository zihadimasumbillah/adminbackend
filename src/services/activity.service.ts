import { UserActivityHistory, UserActivityHistoryInstance } from '../models/user-activity-history.model';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';


export async function recordUserActivity(
  userId: string,
  email: string,
  sessionMinutes: number
): Promise<void> {
  if (sessionMinutes <= 0) {
    console.log(`Skipping non-positive session time: ${sessionMinutes} minutes for user ${userId}`);
    return;
  }

  const cappedMinutes = Math.min(sessionMinutes, 240); 
  if (sessionMinutes > 240) {
    console.log(`Capping session time: ${sessionMinutes} → ${cappedMinutes} minutes for user ${userId}`);
    sessionMinutes = cappedMinutes;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); 
  const dayOfWeek = today.getUTCDay();
  
  try {
    const transaction = await sequelize.transaction();
    
    try {
      const existingRecord = await UserActivityHistory.findOne({
        where: {
          email,
          activity_date: today,
          day_of_week: dayOfWeek
        },
        transaction
      });
      
      if (existingRecord) {
        const sessionCount = existingRecord.session_count || 0;
        let additionalMinutes = sessionMinutes;
        
        if (sessionCount > 3) {
          additionalMinutes = Math.round(sessionMinutes * 0.8);
        }
        if (sessionCount > 7) {
          additionalMinutes = Math.round(sessionMinutes * 0.6);
        }

        const newTotal = Math.min(existingRecord.session_minutes + additionalMinutes, 480);
        
        await existingRecord.update({
          session_minutes: newTotal,
          session_count: existingRecord.session_count + 1,
          user_id: userId,
          is_deleted_user: false
        }, { transaction });
      } else {
        await UserActivityHistory.create({
          user_id: userId,
          email,
          is_deleted_user: false,
          activity_date: today,
          day_of_week: dayOfWeek,
          session_minutes: Math.min(sessionMinutes, 480), 
          session_count: 1
        }, { transaction });
      }
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Failed to update activity history:', error);
  }
}

export async function markUserActivityAsDeleted(userId: string): Promise<void> {
  await UserActivityHistory.update(
    { 
      is_deleted_user: true,
      user_id: null
    },
    { 
      where: { user_id: userId }
    }
  );
}

export async function reconnectUserActivity(userId: string, email: string): Promise<void> {
  try {
    const transaction = await sequelize.transaction();
    
    try {
      const historicalRecordsCount = await UserActivityHistory.count({
        where: {
          email: email,
          is_deleted_user: true
        },
        transaction
      });
      
      if (historicalRecordsCount > 0) {
        console.log(`Found ${historicalRecordsCount} historical records for ${email}`);
 
        await UserActivityHistory.update(
          { 
            user_id: userId, 
            is_deleted_user: false  
          },
          { 
            where: { 
              email: email, 
              is_deleted_user: true 
            },
            transaction
          }
        );
        
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = today.getUTCDay();
        
        const todayRecord = await UserActivityHistory.findOne({
          where: {
            email,
            activity_date: today,
            day_of_week: dayOfWeek,
          },
          transaction
        });

        if (!todayRecord) {
          await UserActivityHistory.create({
            user_id: userId,
            email,
            is_deleted_user: false,
            activity_date: today,
            day_of_week: dayOfWeek,
            session_minutes: 1,  
            session_count: 1
          }, { transaction });
        }
        
        console.log(`Successfully reconnected activity history for ${email}`);
      } else {
        console.log(`No historical records found for ${email}`);
      }
      
      await transaction.commit();
      console.log(`Activity reconnection process completed for user ${userId} with email ${email}`);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Failed to reconnect user activity:', error);
  }
}

export const resetUserActivityHistory = async (email: string) => {
  try {
    await UserActivityHistory.update(
      { is_deleted_user: true, user_id: null },
      { where: { email } }
    );

    console.log(`Reset activity history for email ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to reset activity history for email ${email}:`, error);
    return false;
  }
};
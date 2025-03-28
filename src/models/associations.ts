import { User } from './user.model';
import { UserActivityHistory } from './user-activity-history.model';

export function initializeAssociations() {
  User.hasMany(UserActivityHistory, {
    foreignKey: 'user_id',
    as: 'activityHistory'
  });

  UserActivityHistory.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
}
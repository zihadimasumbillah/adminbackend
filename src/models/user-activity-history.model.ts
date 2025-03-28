import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { User } from './user.model';

interface UserActivityHistoryAttributes {
  id?: string;
  user_id?: string | null;
  email: string;
  is_deleted_user: boolean;
  activity_date: Date;
  day_of_week: number;
  session_minutes: number;
  session_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export class UserActivityHistory extends Model<UserActivityHistoryAttributes> {
  declare id: string;
  declare user_id: string | null;
  declare email: string;
  declare is_deleted_user: boolean;
  declare activity_date: Date;
  declare day_of_week: number;
  declare session_minutes: number;
  declare session_count: number;
  declare created_at: Date;
  declare updated_at: Date;
}

UserActivityHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_deleted_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    activity_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    session_minutes: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    session_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'user_activity_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default UserActivityHistory;
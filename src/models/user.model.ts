import { Model, DataTypes, fn, Op } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id?: string; 
  name: string;
  email: string;
  password: string;
  last_login_time: Date;
  last_activity_time: Date;
  status: 'active' | 'blocked';
  created_at: Date;
  deleted_at: Date | null;
  login_attempts: number;
}

export class User extends Model<UserAttributes> {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare last_login_time: Date;
  declare last_activity_time: Date;
  declare status: 'active' | 'blocked';
  declare created_at: Date;
  declare deleted_at: Date | null;
  declare login_attempts: number;

  static associate(models: any) {
    User.hasMany(models.UserActivityHistory, {
      as: 'activityHistory',
      foreignKey: 'user_id' 
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        async isUnique(value: string) {
          const existingUser = await User.findOne({
            where: {
              name: value,
              deleted_at: null,
              id: { [Op.not]: this.id as string } 
            }
          });
          if (existingUser) {
            throw new Error('Name is already in use');
          }
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { 
        isEmail: true,
        notEmpty: true,
        async isUnique(value: string) {
          const existingUser = await User.findOne({
            where: {
              email: value.toLowerCase(),
              deleted_at: null,
              id: { [Op.not]: this.id as string }
            }
          });
          if (existingUser) {
            throw new Error('Email is already registered');
          }
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_login_time: {
      type: DataTypes.DATE,
      defaultValue: fn('NOW')
    },
    last_activity_time: {
      type: DataTypes.DATE,
      defaultValue: fn('NOW')
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked'),
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: fn('NOW')
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    paranoid: false, 
    createdAt: 'created_at',
    updatedAt: false,
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['email'],
        where: {
          deleted_at: null
        },
        name: 'users_email_active_key'
      },
      {
        name: 'users_name_sort_idx',
        fields: [
          [sequelize.fn('LOWER', sequelize.col('name')), 'ASC'],
          [{ name: 'id', order: 'ASC' }]
        ]
      }
    ]
  }
);

export default User;
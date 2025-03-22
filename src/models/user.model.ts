import { Model, DataTypes, fn, UniqueConstraintError } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  last_login_time: Date;
  status: 'active' | 'blocked';
  created_at: Date;
  deleted_at: Date | null;
}

interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'created_at' | 'deleted_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: string;
  declare name: string;
  declare email: string;
  declare password: string;
  declare last_login_time: Date;
  declare status: 'active' | 'blocked';
  declare created_at: Date;
  declare deleted_at: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: 'users_email_active_key',
        msg: 'This email is already registered'
      },
      validate: {
        isEmail: {
          msg: 'Please enter a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true 
      }
    },
    last_login_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: fn('NOW'),
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: fn('NOW'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'users_email_active_key',
        where: {
          deleted_at: null
        }
      }
    ]
  }
);

export default User;
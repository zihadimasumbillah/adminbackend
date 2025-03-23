import { Model, DataTypes, fn } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id?: string; 
  name: string;
  email: string;
  password: string;
  last_login_time: Date;
  status: 'active' | 'blocked';
  created_at: Date;
  deleted_at: Date | null;
}

export class User extends Model<UserAttributes> {
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
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_login_time: {
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
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: false,
    deletedAt: 'deleted_at'
  }
);

export default User;
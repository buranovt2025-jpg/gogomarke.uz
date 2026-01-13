import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CommentAttributes {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentId' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public videoId!: string;
  public userId!: string;
  public text!: string;
  public parentId!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'video_id',
      references: {
        model: 'videos',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'comments',
    underscored: true,
    timestamps: true,
  }
);

export default Comment;

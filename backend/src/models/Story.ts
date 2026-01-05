import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StoryAttributes {
  id: string;
  sellerId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  caption?: string;
  productId?: string;
  viewCount: number;
  expiresAt: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StoryCreationAttributes extends Optional<StoryAttributes, 'id' | 'thumbnailUrl' | 'caption' | 'productId' | 'viewCount' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Story extends Model<StoryAttributes, StoryCreationAttributes> implements StoryAttributes {
  public id!: string;
  public sellerId!: string;
  public mediaUrl!: string;
  public mediaType!: 'image' | 'video';
  public thumbnailUrl?: string;
  public caption?: string;
  public productId?: string;
  public viewCount!: number;
  public expiresAt!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Story.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    mediaUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      defaultValue: 'image',
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    caption: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'stories',
    timestamps: true,
  }
);

export default Story;

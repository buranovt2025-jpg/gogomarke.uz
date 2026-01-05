import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ContentType, ContentPurpose } from '../types';

interface VideoAttributes {
  id: string;
  ownerId: string;
  productId?: string;
  contentType: ContentType;
  contentPurpose: ContentPurpose;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  titleRu?: string;
  titleUz?: string;
  description?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  isLive: boolean;
  isActive: boolean;
  expiresAt?: Date;
  aiExtractedTitle?: string;
  aiExtractedPrice?: number;
  aiExtractedDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, 'id' | 'productId' | 'contentType' | 'contentPurpose' | 'thumbnailUrl' | 'titleRu' | 'titleUz' | 'description' | 'descriptionRu' | 'descriptionUz' | 'viewCount' | 'likeCount' | 'shareCount' | 'isLive' | 'isActive' | 'expiresAt' | 'aiExtractedTitle' | 'aiExtractedPrice' | 'aiExtractedDescription' | 'createdAt' | 'updatedAt'> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public ownerId!: string;
  public productId?: string;
  public contentType!: ContentType;
  public contentPurpose!: ContentPurpose;
  public videoUrl!: string;
  public thumbnailUrl?: string;
  public title!: string;
  public titleRu?: string;
  public titleUz?: string;
  public description?: string;
  public descriptionRu?: string;
  public descriptionUz?: string;
  public duration!: number;
  public viewCount!: number;
  public likeCount!: number;
  public shareCount!: number;
  public isLive!: boolean;
  public isActive!: boolean;
  public expiresAt?: Date;
  public aiExtractedTitle?: string;
  public aiExtractedPrice?: number;
  public aiExtractedDescription?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    contentType: {
      type: DataTypes.ENUM(...Object.values(ContentType)),
      defaultValue: ContentType.VIDEO,
    },
    contentPurpose: {
      type: DataTypes.ENUM(...Object.values(ContentPurpose)),
      defaultValue: ContentPurpose.PRODUCT_REVIEW,
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    titleRu: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    titleUz: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionRu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descriptionUz: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isLive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    aiExtractedTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    aiExtractedPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    aiExtractedDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'videos',
    modelName: 'Video',
  }
);

export default Video;

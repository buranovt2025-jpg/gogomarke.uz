import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ReportType {
  PRODUCT = 'product',
  VIDEO = 'video',
  REVIEW = 'review',
  COMMENT = 'comment',
  USER = 'user',
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FAKE = 'fake',
  COPYRIGHT = 'copyright',
  VIOLENCE = 'violence',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

interface ReportAttributes {
  id: string;
  reporterId: string;
  targetType: ReportType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'adminNotes' | 'reviewedBy' | 'reviewedAt' | 'createdAt' | 'updatedAt'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: string;
  public reporterId!: string;
  public targetType!: ReportType;
  public targetId!: string;
  public reason!: ReportReason;
  public description?: string;
  public status!: ReportStatus;
  public adminNotes?: string;
  public reviewedBy?: string;
  public reviewedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Report.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(ReportType)),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM(...Object.values(ReportReason)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReportStatus)),
      defaultValue: ReportStatus.PENDING,
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'reports',
    timestamps: true,
  }
);

export default Report;

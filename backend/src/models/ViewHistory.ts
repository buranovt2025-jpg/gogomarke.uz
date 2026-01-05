import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ViewType {
  PRODUCT = 'product',
  VIDEO = 'video',
}

interface ViewHistoryAttributes {
  id: string;
  userId: string;
  targetType: ViewType;
  targetId: string;
  viewedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ViewHistoryCreationAttributes extends Optional<ViewHistoryAttributes, 'id' | 'viewedAt' | 'createdAt' | 'updatedAt'> {}

class ViewHistory extends Model<ViewHistoryAttributes, ViewHistoryCreationAttributes> implements ViewHistoryAttributes {
  public id!: string;
  public userId!: string;
  public targetType!: ViewType;
  public targetId!: string;
  public viewedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ViewHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    targetType: {
      type: DataTypes.ENUM(...Object.values(ViewType)),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'view_history',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'targetType'],
      },
      {
        fields: ['userId', 'targetId', 'targetType'],
        unique: true,
      },
    ],
  }
);

export default ViewHistory;

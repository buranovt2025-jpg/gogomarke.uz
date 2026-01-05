import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum ReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SHIPPED = 'shipped',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  CLOSED = 'closed',
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CHANGED_MIND = 'changed_mind',
  DAMAGED = 'damaged',
  OTHER = 'other',
}

interface ReturnAttributes {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  reason: ReturnReason;
  description: string;
  images?: string[];
  status: ReturnStatus;
  refundAmount?: number;
  adminNotes?: string;
  sellerResponse?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReturnCreationAttributes extends Optional<ReturnAttributes, 'id' | 'status' | 'images' | 'refundAmount' | 'adminNotes' | 'sellerResponse'> {}

class Return extends Model<ReturnAttributes, ReturnCreationAttributes> implements ReturnAttributes {
  public id!: string;
  public orderId!: string;
  public buyerId!: string;
  public sellerId!: string;
  public reason!: ReturnReason;
  public description!: string;
  public images?: string[];
  public status!: ReturnStatus;
  public refundAmount?: number;
  public adminNotes?: string;
  public sellerResponse?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Return.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.ENUM(...Object.values(ReturnReason)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ReturnStatus)),
      defaultValue: ReturnStatus.PENDING,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sellerResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'returns',
    timestamps: true,
  }
);

export default Return;

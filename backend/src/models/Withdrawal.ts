import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { WithdrawalStatus } from '../types';

interface WithdrawalAttributes {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  method: string;
  accountDetails: Record<string, unknown>;
  adminId?: string;
  adminNote?: string;
  processedAt?: Date;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface WithdrawalCreationAttributes extends Optional<WithdrawalAttributes, 'id' | 'adminId' | 'adminNote' | 'processedAt' | 'transactionId' | 'createdAt' | 'updatedAt'> {}

class Withdrawal extends Model<WithdrawalAttributes, WithdrawalCreationAttributes> implements WithdrawalAttributes {
  public id!: string;
  public userId!: string;
  public amount!: number;
  public currency!: string;
  public status!: WithdrawalStatus;
  public method!: string;
  public accountDetails!: Record<string, unknown>;
  public adminId?: string;
  public adminNote?: string;
  public processedAt?: Date;
  public transactionId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Withdrawal.init(
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
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'UZS',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(WithdrawalStatus)),
      defaultValue: WithdrawalStatus.PENDING,
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'card',
    },
    accountDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'withdrawals',
    modelName: 'Withdrawal',
  }
);

export default Withdrawal;

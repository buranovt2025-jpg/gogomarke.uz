import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  ORDER = 'order',
  PAYMENT = 'payment',
  DELIVERY = 'delivery',
  PRODUCT = 'product',
  ACCOUNT = 'account',
  TECHNICAL = 'technical',
  OTHER = 'other',
}

interface TicketAttributes {
  id: string;
  userId: string;
  orderId?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  adminNotes?: string;
  resolution?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'priority' | 'status' | 'assignedTo' | 'adminNotes' | 'resolution'> {}

class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: string;
  public userId!: string;
  public orderId?: string;
  public category!: TicketCategory;
  public subject!: string;
  public description!: string;
  public priority!: TicketPriority;
  public status!: TicketStatus;
  public assignedTo?: string;
  public adminNotes?: string;
  public resolution?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
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
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.ENUM(...Object.values(TicketCategory)),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(TicketPriority)),
      defaultValue: TicketPriority.MEDIUM,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatus)),
      defaultValue: TicketStatus.OPEN,
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tickets',
    timestamps: true,
  }
);

export default Ticket;

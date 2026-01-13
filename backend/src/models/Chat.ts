import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ChatAttributes {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'lastMessageAt' | 'createdAt' | 'updatedAt'> {}

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: string;
  public user1Id!: string;
  public user2Id!: string;
  public lastMessageAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user1Id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    user2Id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chats',
    modelName: 'Chat',
    indexes: [
      {
        unique: true,
        fields: ['user1_id', 'user2_id'],
      },
    ],
  }
);

export default Chat;

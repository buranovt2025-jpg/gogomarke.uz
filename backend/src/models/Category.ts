import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CategoryAttributes {
  id: string;
  name: string;
  nameRu?: string;
  nameUz?: string;
  slug: string;
  description?: string;
  descriptionRu?: string;
  descriptionUz?: string;
  icon?: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'nameRu' | 'nameUz' | 'description' | 'descriptionRu' | 'descriptionUz' | 'icon' | 'isActive' | 'parentId' | 'sortOrder' | 'createdAt' | 'updatedAt'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public nameRu?: string;
  public nameUz?: string;
  public slug!: string;
  public description?: string;
  public descriptionRu?: string;
  public descriptionUz?: string;
  public icon?: string;
  public isActive!: boolean;
  public parentId?: string;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nameRu: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nameUz: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
  }
);

export default Category;
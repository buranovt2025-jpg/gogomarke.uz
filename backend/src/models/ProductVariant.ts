import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductVariantAttributes {
  id: string;
  productId: string;
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  priceModifier: number;
  stock: number;
  images?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductVariantCreationAttributes extends Optional<ProductVariantAttributes, 'id' | 'sku' | 'color' | 'colorHex' | 'size' | 'priceModifier' | 'images' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> implements ProductVariantAttributes {
  public id!: string;
  public productId!: string;
  public sku!: string;
  public color?: string;
  public colorHex?: string;
  public size?: string;
  public priceModifier!: number;
  public stock!: number;
  public images?: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductVariant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    colorHex: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    priceModifier: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      comment: 'Price adjustment from base product price (can be negative or positive)',
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'product_variants',
    modelName: 'ProductVariant',
    indexes: [
      {
        fields: ['product_id'],
      },
      {
        unique: true,
        fields: ['product_id', 'color', 'size'],
        name: 'unique_product_variant',
      },
      {
        unique: true,
        fields: ['sku'],
        name: 'unique_sku',
      },
    ],
  }
);

export default ProductVariant;

import { Response } from 'express';
import { Cart, CartItem, Product, ProductVariant, User } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    let cart = await Cart.findOne({
      where: { userId: user.id },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: User,
                  as: 'seller',
                  attributes: ['id', 'firstName', 'lastName', 'avatar'],
                },
              ],
            },
            {
              model: ProductVariant,
              as: 'variant',
            },
          ],
        },
      ],
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({ userId: user.id });
      await cart.reload({
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                include: [
                  {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'firstName', 'lastName', 'avatar'],
                  },
                ],
              },
              {
                model: ProductVariant,
                as: 'variant',
              },
            ],
          },
        ],
      });
    }

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cart' });
  }
};

export const addCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: 'Product ID is required.' });
      return;
    }

    // Verify product exists and is active
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ success: false, error: 'Product not found or unavailable.' });
      return;
    }

    // Verify variant if provided
    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (!variant || variant.productId !== productId) {
        res.status(404).json({ success: false, error: 'Product variant not found.' });
        return;
      }
    }

    // Check stock
    if (product.stock < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient stock.' });
      return;
    }

    // Get or create cart
    let cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) {
      cart = await Cart.create({ userId: user.id });
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        res.status(400).json({ success: false, error: 'Insufficient stock for requested quantity.' });
        return;
      }
      existingItem.quantity = newQuantity;
      await existingItem.save();
      cartItem = existingItem;
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        variantId,
        quantity,
      });
    }

    // Reload with associations
    await cartItem.reload({
      include: [
        {
          model: Product,
          as: 'product',
        },
        {
          model: ProductVariant,
          as: 'variant',
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: cartItem,
      message: 'Item added to cart.',
    });
  } catch (error) {
    console.error('Add cart item error:', error);
    res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ success: false, error: 'Valid quantity is required.' });
      return;
    }

    const cartItem = await CartItem.findByPk(itemId, {
      include: [
        {
          model: Cart,
          as: 'cart',
        },
        {
          model: Product,
          as: 'product',
        },
      ],
    });

    if (!cartItem) {
      res.status(404).json({ success: false, error: 'Cart item not found.' });
      return;
    }

    // Verify ownership
    const cart = (cartItem as unknown as { cart: Cart }).cart;
    if (cart.userId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Check stock
    const product = (cartItem as unknown as { product: Product }).product;
    if (product.stock < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient stock.' });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    // Reload with associations
    await cartItem.reload({
      include: [
        {
          model: Product,
          as: 'product',
        },
        {
          model: ProductVariant,
          as: 'variant',
        },
      ],
    });

    res.json({
      success: true,
      data: cartItem,
      message: 'Cart item updated.',
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
};

export const removeCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { itemId } = req.params;

    const cartItem = await CartItem.findByPk(itemId, {
      include: [
        {
          model: Cart,
          as: 'cart',
        },
      ],
    });

    if (!cartItem) {
      res.status(404).json({ success: false, error: 'Cart item not found.' });
      return;
    }

    // Verify ownership
    const cart = (cartItem as unknown as { cart: Cart }).cart;
    if (cart.userId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) {
      res.json({
        success: true,
        message: 'Cart is already empty.',
      });
      return;
    }

    await CartItem.destroy({ where: { cartId: cart.id } });

    res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
};

export const getCartCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) {
      res.json({
        success: true,
        data: { count: 0 },
      });
      return;
    }

    const count = await CartItem.count({ where: { cartId: cart.id } });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cart count' });
  }
};

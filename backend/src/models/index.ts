import sequelize from '../config/database';
import User from './User';
import Product from './Product';
import ProductVariant from './ProductVariant';
import Video from './Video';
import Order from './Order';
import Transaction from './Transaction';
import Dispute from './Dispute';
import Review from './Review';
import Address from './Address';
import Message from './Message';
import Favorite from './Favorite';
import Subscription from './Subscription';
import Comment from './Comment';
import Ticket from './Ticket';
import Report from './Report';
import Story from './Story';
import ViewHistory from './ViewHistory';
import Notification from './Notification';
import Cart from './Cart';
import CartItem from './CartItem';

// Define associations
User.hasMany(Product, { foreignKey: 'sellerId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

// ProductVariant associations
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Video, { foreignKey: 'ownerId', as: 'videos' });
Video.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Product.hasMany(Video, { foreignKey: 'productId', as: 'videos' });
Video.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Order, { foreignKey: 'buyerId', as: 'purchases' });
User.hasMany(Order, { foreignKey: 'sellerId', as: 'sales' });
User.hasMany(Order, { foreignKey: 'courierId', as: 'deliveries' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Order.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Order.belongsTo(User, { foreignKey: 'courierId', as: 'courier' });

Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(Order, { foreignKey: 'productId', as: 'orders' });

Order.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
Video.hasMany(Order, { foreignKey: 'videoId', as: 'orders' });

Order.hasMany(Transaction, { foreignKey: 'orderId', as: 'transactions' });
Transaction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasOne(Dispute, { foreignKey: 'orderId', as: 'dispute' });
Dispute.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Dispute, { foreignKey: 'reporterId', as: 'reportedDisputes' });
Dispute.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

User.hasMany(Dispute, { foreignKey: 'assignedAdminId', as: 'assignedDisputes' });
Dispute.belongsTo(User, { foreignKey: 'assignedAdminId', as: 'assignedAdmin' });

Order.hasOne(Review, { foreignKey: 'orderId', as: 'review' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Review, { foreignKey: 'buyerId', as: 'givenReviews' });
Review.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

User.hasMany(Review, { foreignKey: 'sellerId', as: 'receivedReviews' });
Review.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Message associations
Order.hasMany(Message, { foreignKey: 'orderId', as: 'messages' });
Message.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Favorite associations
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Favorite, { foreignKey: 'productId', as: 'favorites' });
Favorite.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Subscription associations
User.hasMany(Subscription, { foreignKey: 'followerId', as: 'following' });
Subscription.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
User.hasMany(Subscription, { foreignKey: 'sellerId', as: 'followers' });
Subscription.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

// Comment associations
Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' });
Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Ticket associations
User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Ticket, { foreignKey: 'assignedTo', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Order.hasMany(Ticket, { foreignKey: 'orderId', as: 'tickets' });
Ticket.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Report associations
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
User.hasMany(Report, { foreignKey: 'reviewedBy', as: 'reviewedReports' });
Report.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Story associations
User.hasMany(Story, { foreignKey: 'sellerId', as: 'stories' });
Story.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Product.hasMany(Story, { foreignKey: 'productId', as: 'stories' });
Story.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ViewHistory associations
User.hasMany(ViewHistory, { foreignKey: 'userId', as: 'viewHistory' });
ViewHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Cart associations
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });

Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

ProductVariant.hasMany(CartItem, { foreignKey: 'variantId', as: 'cartItems' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

export {
  sequelize,
  User,
  Product,
  ProductVariant,
  Video,
  Order,
  Transaction,
  Dispute,
  Review,
  Address,
  Message,
  Favorite,
  Subscription,
  Comment,
  Ticket,
  Report,
  Story,
  ViewHistory,
  Notification,
  Cart,
  CartItem,
};

export const initializeDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Only sync in development mode to avoid schema conflicts in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      await sequelize.sync({ force });
      console.log('Database synchronized successfully.');
    } else {
      console.log('Production mode: Skipping database sync. Use migrations instead.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

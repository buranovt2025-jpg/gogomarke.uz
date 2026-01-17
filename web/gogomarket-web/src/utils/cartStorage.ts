/**
 * Cart Storage Utility for Guest Users
 * Stores cart items in localStorage until user logs in
 */

export interface GuestCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

const GUEST_CART_KEY = 'guest_cart';

export const cartStorage = {
  /**
   * Get all items from guest cart
   */
  getItems(): GuestCartItem[] {
    try {
      const data = localStorage.getItem(GUEST_CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse guest cart:', error);
      return [];
    }
  },

  /**
   * Set all items in guest cart
   */
  setItems(items: GuestCartItem[]): void {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save guest cart:', error);
    }
  },

  /**
   * Add item to guest cart (or update quantity if exists)
   */
  addItem(item: GuestCartItem): void {
    const items = this.getItems();
    const existingIndex = items.findIndex(
      i => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += item.quantity;
    } else {
      items.push(item);
    }

    this.setItems(items);
  },

  /**
   * Update item quantity in guest cart
   */
  updateQuantity(productId: string, quantity: number, variantId?: string): void {
    const items = this.getItems();
    const index = items.findIndex(
      i => i.productId === productId && i.variantId === variantId
    );

    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      this.setItems(items);
    }
  },

  /**
   * Remove item from guest cart
   */
  removeItem(productId: string, variantId?: string): void {
    const items = this.getItems().filter(
      i => !(i.productId === productId && i.variantId === variantId)
    );
    this.setItems(items);
  },

  /**
   * Clear all items from guest cart
   */
  clear(): void {
    localStorage.removeItem(GUEST_CART_KEY);
  },

  /**
   * Get total count of items in guest cart
   */
  getCount(): number {
    return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
  },

  /**
   * Check if guest cart has items
   */
  hasItems(): boolean {
    return this.getItems().length > 0;
  },

  /**
   * Get items formatted for API merge request
   */
  getItemsForMerge(): { productId: string; variantId?: string; quantity: number }[] {
    return this.getItems().map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
  },
};

export default cartStorage;

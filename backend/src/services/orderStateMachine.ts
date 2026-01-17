/**
 * Order State Machine - Enforces strict status transitions
 * 
 * Valid transitions:
 * PENDING -> CONFIRMED (seller confirms)
 * PENDING -> CANCELLED (buyer/seller cancels)
 * CONFIRMED -> PICKED_UP (courier picks up)
 * CONFIRMED -> CANCELLED (can be cancelled before pickup)
 * PICKED_UP -> IN_TRANSIT (optional intermediate state)
 * PICKED_UP -> DELIVERED (courier delivers)
 * IN_TRANSIT -> DELIVERED (courier delivers)
 * Any -> DISPUTED (dispute opened)
 */

import { OrderStatus } from '../types';

// Define valid transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
  [OrderStatus.DISPUTED]: [OrderStatus.CANCELLED], // Can resolve dispute by cancellation
};

// Status descriptions for UI
const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Ожидает подтверждения продавца',
  [OrderStatus.CONFIRMED]: 'Подтвержден, ожидает курьера',
  [OrderStatus.PICKED_UP]: 'Забран курьером',
  [OrderStatus.IN_TRANSIT]: 'В пути к покупателю',
  [OrderStatus.DELIVERED]: 'Доставлен',
  [OrderStatus.CANCELLED]: 'Отменен',
  [OrderStatus.DISPUTED]: 'Открыт спор',
};

class OrderStateMachine {
  /**
   * Check if transition is valid
   */
  canTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // DISPUTED can be set from most states (except terminal)
    if (newStatus === OrderStatus.DISPUTED) {
      return currentStatus !== OrderStatus.DELIVERED && currentStatus !== OrderStatus.CANCELLED;
    }

    const validNextStatuses = VALID_TRANSITIONS[currentStatus];
    return validNextStatuses?.includes(newStatus) ?? false;
  }

  /**
   * Get valid next statuses for current status
   */
  getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    const validStatuses = [...(VALID_TRANSITIONS[currentStatus] || [])];
    
    // Add DISPUTED as valid from non-terminal states
    if (currentStatus !== OrderStatus.DELIVERED && currentStatus !== OrderStatus.CANCELLED) {
      validStatuses.push(OrderStatus.DISPUTED);
    }
    
    return validStatuses;
  }

  /**
   * Validate transition and return error message if invalid
   */
  validateTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): { valid: boolean; error?: string } {
    if (currentStatus === newStatus) {
      return { valid: false, error: 'Order is already in this status' };
    }

    if (!this.canTransition(currentStatus, newStatus)) {
      const validStatuses = this.getValidNextStatuses(currentStatus);
      return {
        valid: false,
        error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${validStatuses.join(', ') || 'none'}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get status description
   */
  getStatusDescription(status: OrderStatus): string {
    return STATUS_DESCRIPTIONS[status] || status;
  }

  /**
   * Check if status is terminal (no more transitions possible)
   */
  isTerminalStatus(status: OrderStatus): boolean {
    return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
  }

  /**
   * Check if order can be cancelled from current status
   */
  canCancel(currentStatus: OrderStatus): boolean {
    return this.canTransition(currentStatus, OrderStatus.CANCELLED);
  }

  /**
   * Check if funds should be distributed (order completed successfully)
   */
  shouldDistributeFunds(newStatus: OrderStatus): boolean {
    return newStatus === OrderStatus.DELIVERED;
  }

  /**
   * Check if funds should be reversed (order cancelled after payment)
   */
  shouldReverseFunds(newStatus: OrderStatus, paymentWasHeld: boolean): boolean {
    return newStatus === OrderStatus.CANCELLED && paymentWasHeld;
  }
}

// Export singleton instance
const orderStateMachine = new OrderStateMachine();
export default orderStateMachine;

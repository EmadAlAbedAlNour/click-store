const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const parseOfferDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const clampPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
const STATUS_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['pending', 'shipped', 'cancelled'],
  shipped: ['processing', 'completed'],
  completed: ['shipped'],
  cancelled: ['pending', 'processing']
};

const normalizeStatus = (value) => {
  const s = String(value || 'pending').toLowerCase();
  return ORDER_STATUSES.includes(s) ? s : 'pending';
};

const isTransitionAllowed = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  return (STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const parseItems = (raw) => {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const aggregateStockAdjustments = (items) => {
  const map = new Map();
  items.forEach((item) => {
    const quantity = Math.max(0, Math.trunc(Number(item?.quantity || 0)));
    if (quantity <= 0) return;

    const variantId = Math.trunc(Number(item?.variant_id || 0));
    const productId = Math.trunc(Number(item?.id || 0));
    const isVariant = variantId > 0;
    const entityId = isVariant ? variantId : productId;
    if (entityId <= 0) return;

    const key = `${isVariant ? 'variant' : 'product'}-${entityId}`;
    const existing = map.get(key) || { type: isVariant ? 'variant' : 'product', id: entityId, quantity: 0 };
    existing.quantity += quantity;
    map.set(key, existing);
  });
  return Array.from(map.values()).filter((entry) => entry.quantity > 0);
};

export const createOrderService = ({ orderRepository }) => ({
  async placeOrder({ payload, staffUser, customer, requireCustomerActiveById }) {
    const { customer_name, customer_phone, customer_address, items, source, coupon_code, order_notes } = payload;
    const requestedSource = String(source || 'online').trim().toLowerCase();
    const safeSource = requestedSource === 'pos' ? 'pos' : 'online';
    const orderItems = Array.isArray(items) ? items : [];

    if (safeSource === 'pos' && !staffUser) {
      throw createHttpError(403, 'POS orders require staff authentication');
    }
    if (orderItems.length === 0) {
      throw createHttpError(400, 'Order items are required');
    }

    if (customer) {
      const isActive = await requireCustomerActiveById(customer.id);
      if (!isActive) {
        throw createHttpError(403, 'Customer account is inactive');
      }
    }

    const [coupon, offerSettingsRaw] = await Promise.all([
      orderRepository.findActiveCouponByCode(coupon_code),
      orderRepository.getOfferSettings()
    ]);

    const offerSettings = offerSettingsRaw || {};
    let subtotal = 0;
    const processedItems = [];

    const specialOfferProductId = Math.max(0, Math.trunc(Number(offerSettings?.special_offer_product_id || 0)));
    const specialOfferEnabled = Number(offerSettings?.special_offer_enabled) === 1 && specialOfferProductId > 0;
    const specialOfferStart = parseOfferDateTime(offerSettings?.special_offer_start_at);
    const specialOfferEnd = parseOfferDateTime(offerSettings?.special_offer_end_at);
    const nowTs = Date.now();
    const isSpecialOfferStarted = !specialOfferStart || nowTs >= specialOfferStart.getTime();
    const isSpecialOfferExpired = !!specialOfferEnd && nowTs > specialOfferEnd.getTime();
    const isSpecialOfferActive = specialOfferEnabled && isSpecialOfferStarted && !isSpecialOfferExpired;
    const specialOfferDiscountPercent = clampPercent(offerSettings?.special_offer_discount_percent);
    const specialOfferOverrideRaw = Number(offerSettings?.special_offer_override_price || 0);
    const specialOfferOverridePrice = Number.isFinite(specialOfferOverrideRaw) ? Math.max(0, specialOfferOverrideRaw) : 0;

    const resolveOfferUnitPrice = (productId, regularUnitPrice) => {
      const regular = Math.max(0, Number(regularUnitPrice || 0));
      if (!isSpecialOfferActive) return regular;
      if (Number(productId) !== specialOfferProductId) return regular;
      const discountedPrice = Math.max(0, regular * (1 - (specialOfferDiscountPercent / 100)));
      const offerPriceRaw = specialOfferOverridePrice > 0 ? specialOfferOverridePrice : discountedPrice;
      return Math.min(offerPriceRaw, regular || offerPriceRaw);
    };

    for (const item of orderItems) {
      const quantity = Math.max(1, Math.trunc(Number(item?.quantity || 1)));
      if (item.variant_id) {
        let variant;
        try {
          variant = await orderRepository.getVariantWithProductCost(item.variant_id);
        } catch (error) {
          throw createHttpError(400, error.message || 'Unable to load variant');
        }
        if (!variant) throw createHttpError(400, `Variant not found for product: ${item.name}`);
        if (Number(variant.stock_quantity || 0) < quantity) {
          throw createHttpError(400, `Stock insufficient for variant: ${item.name} (${variant.name})`);
        }

        const regularPrice = Number(variant.price || 0);
        const resolvedPrice = resolveOfferUnitPrice(variant.product_id, regularPrice);
        processedItems.push({
          ...item,
          quantity,
          price: resolvedPrice,
          regular_price: regularPrice,
          offer_applied: resolvedPrice < regularPrice ? 1 : 0,
          cost_price: Number(variant.cost_price ?? variant.product_cost_price ?? 0),
          name: `${item.name} (${variant.name})`
        });
        subtotal += resolvedPrice * quantity;
      } else {
        let product;
        try {
          product = await orderRepository.getProductById(item.id);
        } catch (error) {
          throw createHttpError(400, error.message || 'Unable to load product');
        }
        if (!product) throw createHttpError(400, `Product not found: ${item.name}`);
        if (Number(product.stock_quantity || 0) < quantity) {
          throw createHttpError(400, `Stock insufficient for product: ${item.name}`);
        }

        const regularPrice = Number(product.base_price || 0);
        const resolvedPrice = resolveOfferUnitPrice(product.id, regularPrice);
        processedItems.push({
          ...item,
          quantity,
          price: resolvedPrice,
          regular_price: regularPrice,
          offer_applied: resolvedPrice < regularPrice ? 1 : 0,
          cost_price: Number(product.cost_price || 0)
        });
        subtotal += resolvedPrice * quantity;
      }
    }

    let discountAmount = 0;
    if (coupon) {
      if (coupon.type === 'percent') discountAmount = (subtotal * coupon.value) / 100;
      else discountAmount = coupon.value;
    }

    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRatePercent = clampPercent(offerSettings?.tax_rate);
    const taxAmount = (taxableSubtotal * taxRatePercent) / 100;
    const totalAmount = taxableSubtotal + taxAmount;

    const deductionMap = new Map();
    processedItems.forEach((item) => {
      const isVariant = Boolean(item.variant_id);
      const entityId = Number(isVariant ? item.variant_id : item.id);
      const key = `${isVariant ? 'variant' : 'product'}-${entityId}`;
      const existing = deductionMap.get(key) || {
        type: isVariant ? 'variant' : 'product',
        id: entityId,
        quantity: 0
      };
      existing.quantity += Number(item.quantity || 0);
      deductionMap.set(key, existing);
    });
    const deductions = Array.from(deductionMap.values()).filter((entry) => entry.quantity > 0);

    let transactionStarted = false;
    try {
      await orderRepository.beginTransaction();
      transactionStarted = true;

      for (const deduction of deductions) {
        const result = await orderRepository.deductStock(deduction);
        if (result.changes === 0) {
          const entityLabel = deduction.type === 'variant' ? 'variant' : 'product';
          throw createHttpError(409, `Stock is no longer available for ${entityLabel} #${deduction.id}`);
        }
      }

      const inserted = await orderRepository.insertOrder({
        customer_id: customer?.id || null,
        customer_email: customer?.email || '',
        customer_name,
        customer_phone,
        customer_address,
        order_notes: order_notes || '',
        subtotal,
        discount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        items_json: JSON.stringify(processedItems),
        source: safeSource,
        payment_method: 'cod',
        status: safeSource === 'pos' ? 'completed' : 'pending'
      });

      await orderRepository.commitTransaction();
      transactionStarted = false;

      return {
        id: inserted.lastID,
        subtotal,
        discount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        total: totalAmount,
        items: processedItems,
        created_at: new Date().toISOString(),
        message: 'Order placed successfully'
      };
    } catch (error) {
      if (transactionStarted) {
        try {
          await orderRepository.rollbackTransaction();
        } catch {
          // ignore rollback errors
        }
      }
      throw error;
    }
  },

  async listOrders() {
    return orderRepository.listOrders();
  },

  async bulkUpdateOrders({ payload, userId, logActivity }) {
    const rawIds = Array.isArray(payload?.ids) ? payload.ids : [];
    const orderIds = Array.from(
      new Set(
        rawIds
          .map((value) => Number(value))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    if (orderIds.length === 0) {
      throw createHttpError(400, 'Order ids are required');
    }

    if (orderIds.length > 300) {
      throw createHttpError(400, 'Too many orders in one request');
    }

    if (!hasOwn(payload, 'status')) {
      throw createHttpError(400, 'Bulk status is required');
    }

    const requestedStatus = String(payload?.status || '').toLowerCase().trim();
    if (!ORDER_STATUSES.includes(requestedStatus)) {
      throw createHttpError(400, 'Invalid order status');
    }

    const updatedOrders = [];
    const failures = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.updateOrder({
          orderIdInput: orderId,
          payload: { status: requestedStatus },
          userId,
          logActivity
        });
        if (result?.order) updatedOrders.push(result.order);
      } catch (error) {
        failures.push({
          id: orderId,
          error: error?.message || 'Unable to update order',
          status: Number(error?.status || 500)
        });
      }
    }

    return {
      message: failures.length > 0
        ? 'Bulk order update completed with some failures'
        : 'Bulk order update completed',
      processed: updatedOrders.length,
      failed: failures.length,
      updated_orders: updatedOrders,
      failures
    };
  },

  async updateOrder({ orderIdInput, payload, userId, logActivity }) {
    const orderId = Number(orderIdInput);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      throw createHttpError(400, 'Invalid order id');
    }

    const currentOrder = await orderRepository.findOrderById(orderId);
    if (!currentOrder) throw createHttpError(404, 'Order not found');

    const { customer_name, customer_phone, customer_address, order_notes } = payload;
    const currentStatus = normalizeStatus(currentOrder.status);
    const hasStatusInput = hasOwn(payload, 'status');
    let nextStatus = currentStatus;

    if (hasStatusInput) {
      const requestedStatus = String(payload?.status || '').toLowerCase().trim();
      if (!ORDER_STATUSES.includes(requestedStatus)) {
        throw createHttpError(400, 'Invalid order status');
      }
      nextStatus = requestedStatus;
      if (!isTransitionAllowed(currentStatus, nextStatus)) {
        throw createHttpError(409, `Invalid status transition from ${currentStatus} to ${nextStatus}`);
      }
    }

    const shouldRestock = hasStatusInput && currentStatus !== 'cancelled' && nextStatus === 'cancelled';
    const shouldDeduct = hasStatusInput && currentStatus === 'cancelled' && nextStatus !== 'cancelled';
    const stockAdjustments = aggregateStockAdjustments(parseItems(currentOrder.items_json));

    const totalInput = Number(payload?.total_amount);
    const safeTotalAmount = Number.isFinite(totalInput) ? Math.max(0, totalInput) : null;

    if ((!shouldRestock && !shouldDeduct) || stockAdjustments.length === 0) {
      await orderRepository.updateOrder(orderId, {
        status: nextStatus,
        customer_name,
        customer_phone,
        customer_address,
        order_notes,
        total_amount: safeTotalAmount
      });
      const updatedOrder = await orderRepository.findOrderById(orderId);
      logActivity(userId, 'update', 'order', orderId, {
        status_from: currentStatus,
        status_to: nextStatus
      });
      return { message: 'Order updated successfully', order: updatedOrder };
    }

    let transactionStarted = false;
    try {
      await orderRepository.beginTransaction();
      transactionStarted = true;

      const restockWarnings = [];
      for (const entry of stockAdjustments) {
        const stockResult = shouldRestock
          ? await orderRepository.restockStock(entry)
          : await orderRepository.deductStock(entry);

        if (stockResult.changes === 0) {
          if (shouldRestock) {
            restockWarnings.push(`Skipped restock for missing ${entry.type} #${entry.id}`);
            continue;
          }
          throw createHttpError(409, `Stock is no longer available for ${entry.type} #${entry.id}`);
        }
      }

      await orderRepository.updateOrder(orderId, {
        status: nextStatus,
        customer_name,
        customer_phone,
        customer_address,
        order_notes,
        total_amount: safeTotalAmount
      });

      await orderRepository.commitTransaction();
      transactionStarted = false;

      const updatedOrder = await orderRepository.findOrderById(orderId);

      logActivity(userId, 'update', 'order', orderId, {
        status_from: currentStatus,
        status_to: nextStatus,
        stock_adjustment: shouldRestock ? 'restock' : 'deduct',
        restock_warnings: restockWarnings
      });

      if (restockWarnings.length > 0) {
        return {
          message: 'Order updated successfully',
          warning: 'Some stock rows could not be restocked because linked products or variants no longer exist.',
          order: updatedOrder
        };
      }

      return { message: 'Order updated successfully', order: updatedOrder };
    } catch (error) {
      if (transactionStarted) {
        try {
          await orderRepository.rollbackTransaction();
        } catch {
          // ignore rollback errors
        }
      }
      throw error;
    }
  }
});

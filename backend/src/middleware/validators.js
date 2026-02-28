const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateSettingsPayload = (req, res, next) => {
  const body = req.body || {};
  const numericFields = ['shipping_cost', 'tax_rate', 'free_shipping_threshold', 'home_featured_count'];

  for (const key of numericFields) {
    if (body[key] === undefined) continue;
    if (toFiniteNumber(body[key]) === null) {
      return res.status(400).json({ error: `Invalid number for ${key}` });
    }
  }

  if (body.tax_rate !== undefined) {
    const taxRate = toFiniteNumber(body.tax_rate);
    if (taxRate === null || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({ error: 'tax_rate must be between 0 and 100' });
    }
  }

  next();
};

export const validateProductPayload = (req, res, next) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const basePrice = toFiniteNumber(body.base_price);
  if (basePrice === null || basePrice < 0) {
    return res.status(400).json({ error: 'base_price must be a non-negative number' });
  }

  const costPrice = body.cost_price === undefined ? 0 : toFiniteNumber(body.cost_price);
  if (costPrice === null || costPrice < 0) {
    return res.status(400).json({ error: 'cost_price must be a non-negative number' });
  }

  const hasVariants = Number(body.has_variants) === 1 || body.has_variants === true;
  const variants = Array.isArray(body.variants) ? body.variants : [];

  if (hasVariants && variants.length === 0) {
    return res.status(400).json({ error: 'At least one variant is required when has_variants is enabled' });
  }

  if (hasVariants) {
    for (const variant of variants) {
      if (!isNonEmptyString(variant?.name)) {
        return res.status(400).json({ error: 'Each variant must have a name' });
      }
      const variantPrice = toFiniteNumber(variant?.price);
      const variantCost = variant?.cost_price === undefined ? 0 : toFiniteNumber(variant?.cost_price);
      const variantStock = toFiniteNumber(variant?.stock_quantity);
      if (variantPrice === null || variantPrice < 0) {
        return res.status(400).json({ error: 'Each variant price must be a non-negative number' });
      }
      if (variantCost === null || variantCost < 0) {
        return res.status(400).json({ error: 'Each variant cost_price must be a non-negative number' });
      }
      if (variantStock === null || variantStock < 0) {
        return res.status(400).json({ error: 'Each variant stock_quantity must be a non-negative number' });
      }
    }
  } else {
    const stock = toFiniteNumber(body.stock_quantity);
    if (stock === null || stock < 0) {
      return res.status(400).json({ error: 'stock_quantity must be a non-negative number' });
    }
  }

  next();
};

export const validateOrderPayload = (req, res, next) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return res.status(400).json({ error: 'Order items are required' });
  }

  for (const item of items) {
    const quantity = Math.trunc(Number(item?.quantity || 0));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Each order item must have quantity greater than 0' });
    }

    const productId = Math.trunc(Number(item?.id || 0));
    const variantId = Math.trunc(Number(item?.variant_id || 0));
    if (productId <= 0 && variantId <= 0) {
      return res.status(400).json({ error: 'Each order item must include a valid product id or variant_id' });
    }
  }

  const source = String(body.source || 'online').trim().toLowerCase();
  if (source && !['online', 'pos'].includes(source)) {
    return res.status(400).json({ error: 'source must be either online or pos' });
  }

  next();
};

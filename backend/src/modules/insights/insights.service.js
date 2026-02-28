export const createInsightService = ({ insightRepository }) => {
  const toNumber = (value, decimals = 2) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return 0;
    return Number(n.toFixed(decimals));
  };

  const toDateKey = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const shiftDays = (date, days) => {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + days);
    return shifted;
  };

  const statusLabel = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'processing') return 'Processing';
    if (s === 'shipped') return 'Shipped';
    if (s === 'completed') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const parseRangeDays = (daysInput) => {
    const parsedDays = parseInt(daysInput, 10);
    return Number.isFinite(parsedDays)
      ? Math.min(90, Math.max(7, parsedDays))
      : 14;
  };

  const buildAnalytics = async (daysInput) => {
    const rangeDays = parseRangeDays(daysInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentRangeStart = toDateKey(shiftDays(today, -(rangeDays - 1)));
    const prevRangeStart = toDateKey(shiftDays(today, -((rangeDays * 2) - 1)));
    const prevRangeEnd = toDateKey(shiftDays(today, -rangeDays));
    const lowStockWarningThreshold = 10;
    const lowStockCriticalThreshold = 3;

    const [
      settingsRow,
      summaryRow,
      statusRows,
      trendRows,
      lowStockRows,
      ordersRows,
      productRows,
      variantRows
    ] = await Promise.all([
      insightRepository.getSettingsRow(),
      insightRepository.getSummaryRow({ currentRangeStart, prevRangeStart, prevRangeEnd }),
      insightRepository.getStatusDistribution(),
      insightRepository.getRevenueTrendRows(currentRangeStart),
      insightRepository.getLowStockRows(lowStockWarningThreshold),
      insightRepository.getOrdersForCost(),
      insightRepository.getProductMeta(),
      insightRepository.getVariantMeta()
    ]);

    const totalSales = toNumber(summaryRow?.total_sales || 0);
    const ordersCount = Number(summaryRow?.orders_count || 0);
    const revenueOrdersCount = Number(summaryRow?.revenue_orders_count || 0);
    const currentRevenue = toNumber(summaryRow?.current_revenue || 0);
    const previousRevenue = toNumber(summaryRow?.previous_revenue || 0);
    const currentOrders = Number(summaryRow?.current_orders || 0);
    const previousOrders = Number(summaryRow?.previous_orders || 0);
    const avgOrderValue = revenueOrdersCount > 0 ? toNumber(totalSales / revenueOrdersCount) : 0;
    const revenueGrowthPct = previousRevenue > 0
      ? toNumber(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : (currentRevenue > 0 ? 100 : 0);
    const ordersGrowthPct = previousOrders > 0
      ? toNumber(((currentOrders - previousOrders) / previousOrders) * 100)
      : (currentOrders > 0 ? 100 : 0);

    const trendByDay = new Map(
      trendRows.map((row) => [
        row.day,
        {
          revenue: toNumber(row.revenue || 0),
          orders: Number(row.orders_count || 0),
          traffic: Number(row.traffic || 0)
        }
      ])
    );

    const revenueTrend = [];
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dateKey = toDateKey(day);
      const existing = trendByDay.get(dateKey) || { revenue: 0, orders: 0, traffic: 0 };
      revenueTrend.push({
        date: dateKey,
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: toNumber(existing.revenue || 0),
        orders: Number(existing.orders || 0),
        traffic: Number(existing.traffic || 0)
      });
    }

    const productMetaMap = new Map(
      productRows.map((p) => [
        Number(p.id),
        {
          category: p.category || 'Uncategorized',
          cost_price: Number(p.cost_price || 0)
        }
      ])
    );
    const variantCostMap = new Map(
      variantRows.map((v) => [Number(v.id), Number(v.cost_price || 0)])
    );

    const categoryBuckets = new Map();
    const costByDay = new Map();
    let totalCost = 0;
    ordersRows.forEach((orderRow) => {
      const dateKey = String(orderRow.created_at || '').slice(0, 10);
      let orderCost = 0;
      let items = [];
      try {
        items = JSON.parse(orderRow.items_json || '[]');
      } catch {
        items = [];
      }
      if (!Array.isArray(items)) items = [];

      items.forEach((item) => {
        const productId = Number(item.id);
        const variantId = Number(item.variant_id || 0);
        const productMeta = productMetaMap.get(productId) || { category: 'Uncategorized', cost_price: 0 };
        const fallbackCategory = (item.category || '').trim();
        const category = (productMeta.category || fallbackCategory || 'Uncategorized').trim();
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.price || 0);
        const unitCost = Number.isFinite(Number(item.cost_price))
          ? Number(item.cost_price)
          : (variantId && variantCostMap.has(variantId)
            ? Number(variantCostMap.get(variantId) || 0)
            : Number(productMeta.cost_price || 0));
        const revenue = quantity * unitPrice;
        const cost = quantity * unitCost;
        if (quantity <= 0 && revenue <= 0 && cost <= 0) return;

        orderCost += cost;

        const bucket = categoryBuckets.get(category) || {
          name: category,
          value: 0,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
        bucket.value += revenue;
        bucket.revenue += revenue;
        bucket.cost += cost;
        bucket.profit += (revenue - cost);
        bucket.quantity += quantity;
        categoryBuckets.set(category, bucket);
      });

      if (dateKey) {
        costByDay.set(dateKey, (costByDay.get(dateKey) || 0) + orderCost);
      }
      totalCost += orderCost;
    });

    const grossProfit = toNumber(totalSales - totalCost);
    const profitMarginPct = totalSales > 0 ? toNumber((grossProfit / totalSales) * 100) : 0;

    const categoryDistribution = Array.from(categoryBuckets.values())
      .map((row) => ({
        name: row.name,
        value: toNumber(row.value || 0),
        revenue: toNumber(row.revenue || 0),
        cost: toNumber(row.cost || 0),
        profit: toNumber(row.profit || 0),
        quantity: Number(row.quantity || 0)
      }))
      .sort((a, b) => b.value - a.value);

    revenueTrend.forEach((point) => {
      const dayCost = toNumber(costByDay.get(point.date) || 0);
      point.cost = dayCost;
      point.profit = toNumber(point.revenue - dayCost);
    });

    const statusDistribution = statusRows.map((row) => ({
      status: row.status || 'pending',
      name: statusLabel(row.status),
      value: Number(row.count || 0)
    }));

    const lowStock = lowStockRows.map((row) => {
      const stock = Number(row.stock_quantity || 0);
      const severity = stock <= lowStockCriticalThreshold ? 'critical' : 'warning';
      return {
        product_id: row.product_id,
        product_name: row.product_name,
        category: row.category,
        item_type: row.item_type,
        name: row.display_name,
        stock_quantity: stock,
        severity
      };
    });

    const lowStockSummary = {
      critical: lowStock.filter((i) => i.severity === 'critical').length,
      warning: lowStock.filter((i) => i.severity === 'warning').length,
      total: lowStock.length
    };

    return {
      generated_at: new Date().toISOString(),
      range_days: rangeDays,
      currency: settingsRow?.currency || 'USD',
      currency_symbol: settingsRow?.currency_symbol || '$',
      site_name: settingsRow?.site_name || 'Store',
      total_sales: totalSales,
      total_cost: toNumber(totalCost),
      gross_profit: grossProfit,
      orders_count: ordersCount,
      low_stock: lowStock,
      kpis: {
        total_sales: totalSales,
        total_cost: toNumber(totalCost),
        gross_profit: grossProfit,
        profit_margin_pct: profitMarginPct,
        orders_count: ordersCount,
        revenue_orders_count: revenueOrdersCount,
        avg_order_value: avgOrderValue,
        completed_orders: Number(summaryRow?.completed_orders || 0),
        pending_orders: Number(summaryRow?.pending_orders || 0),
        revenue_growth_pct: revenueGrowthPct,
        orders_growth_pct: ordersGrowthPct
      },
      revenue_trend: revenueTrend,
      category_distribution: categoryDistribution,
      traffic_vs_sales: revenueTrend.map((d) => ({
        date: d.date,
        label: d.label,
        traffic: d.traffic,
        sales: d.orders,
        revenue: d.revenue,
        cost: d.cost,
        profit: d.profit
      })),
      status_distribution: statusDistribution,
      low_stock_summary: lowStockSummary
    };
  };

  const listActivity = async (limitInput) => {
    const parsed = parseInt(limitInput, 10);
    const limit = Number.isFinite(parsed)
      ? Math.min(1000, Math.max(1, parsed))
      : 200;
    return insightRepository.listActivity(limit);
  };

  return {
    buildAnalytics,
    listActivity
  };
};

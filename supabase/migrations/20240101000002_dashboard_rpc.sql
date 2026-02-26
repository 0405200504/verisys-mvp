-- Function to get Dashboard KPIs
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
  p_company_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_product_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_pedidos INT;
  v_total_faturado NUMERIC(15,2);
  v_ticket_medio NUMERIC(15,2);
  v_status_counts JSONB;
  v_top_products JSONB;
  v_top_clients JSONB;
BEGIN
  -- Build dynamic base query
  -- Total orders count
  SELECT COUNT(*) INTO v_total_pedidos
  FROM orders o
  WHERE o.company_id = p_company_id
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    AND (p_product_id IS NULL OR EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p_product_id));

  -- Total Faturado (only considering non-canceled, or maybe just faturado/aprovado)
  SELECT COALESCE(SUM(o.total), 0) INTO v_total_faturado
  FROM orders o
  WHERE o.company_id = p_company_id
    AND o.status NOT IN ('cancelado', 'rascunho')
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    AND (p_product_id IS NULL OR EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p_product_id));

  -- Ticket Medio
  IF v_total_pedidos > 0 THEN
    v_ticket_medio := v_total_faturado / v_total_pedidos;
  ELSE
    v_ticket_medio := 0;
  END IF;

  -- Status Distribution
  SELECT jsonb_agg(jsonb_build_object('status', status, 'count', count)) INTO v_status_counts
  FROM (
    SELECT o.status, COUNT(*) as count
    FROM orders o
    WHERE o.company_id = p_company_id
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
      AND (p_product_id IS NULL OR EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p_product_id))
    GROUP BY o.status
  ) sub;

  -- Top 5 Products by Quantity
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', sub2.name, 'qty', sub2.total_qty, 'value', sub2.total_val)), '[]'::jsonb) INTO v_top_products
  FROM (
    SELECT oi.description_snapshot as name, SUM(oi.qty) as total_qty, SUM(oi.total) as total_val
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.company_id = p_company_id
      AND o.status NOT IN ('cancelado')
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
    GROUP BY oi.description_snapshot
    ORDER BY total_qty DESC
    LIMIT 5
  ) sub2;

  -- Top 5 Clients by Value
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', sub3.nome_razao_social, 'value', sub3.total_val)), '[]'::jsonb) INTO v_top_clients
  FROM (
    SELECT c.nome_razao_social, SUM(o.total) as total_val
    FROM orders o
    JOIN clients c ON c.id = o.client_id
    WHERE o.company_id = p_company_id
      AND o.status NOT IN ('cancelado', 'rascunho')
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at <= p_end_date)
      AND (p_product_id IS NULL OR EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p_product_id))
    GROUP BY c.id, c.nome_razao_social
    ORDER BY total_val DESC
    LIMIT 5
  ) sub3;

  -- Build Result JSON
  v_result := jsonb_build_object(
    'total_pedidos', COALESCE(v_total_pedidos, 0),
    'total_faturado', COALESCE(v_total_faturado, 0),
    'ticket_medio', COALESCE(v_ticket_medio, 0),
    'status_counts', COALESCE(v_status_counts, '[]'::jsonb),
    'top_products', v_top_products,
    'top_clients', v_top_clients
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

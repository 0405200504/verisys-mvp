CREATE OR REPLACE FUNCTION get_next_order_number(p_company_id UUID)
RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO company_counters (company_id, next_order_number, next_quote_number)
  VALUES (p_company_id, 2, 1)
  ON CONFLICT (company_id) DO UPDATE 
  SET next_order_number = company_counters.next_order_number + 1
  RETURNING company_counters.next_order_number - 1 INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_next_quote_number(p_company_id UUID)
RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO company_counters (company_id, next_order_number, next_quote_number)
  VALUES (p_company_id, 1, 2)
  ON CONFLICT (company_id) DO UPDATE 
  SET next_quote_number = company_counters.next_quote_number + 1
  RETURNING company_counters.next_quote_number - 1 INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

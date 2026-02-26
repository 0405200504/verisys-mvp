-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-------------------------------------------------------------------------------
-- 1. profiles
-------------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 2. companies
-------------------------------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 3. company_members
-------------------------------------------------------------------------------
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Indexes for quick lookup
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);

-------------------------------------------------------------------------------
-- 4. clients
-------------------------------------------------------------------------------
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  tipo_pessoa TEXT CHECK (tipo_pessoa IN ('PF', 'PJ')),
  nome_razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf_cnpj TEXT,
  ie TEXT,
  im TEXT,
  contribuinte_icms TEXT CHECK (contribuinte_icms IN ('sim', 'não', 'isento')),
  
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  contato_responsavel TEXT,
  
  -- endereco
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  pais TEXT DEFAULT 'Brasil',
  
  endereco_cobranca JSONB,
  endereco_entrega JSONB,
  
  limite_credito NUMERIC(15,2),
  condicoes_pagamento TEXT,
  observacoes TEXT,
  tags TEXT[],
  
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 5. products
-------------------------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Basic
  name TEXT NOT NULL,
  descricao_curta TEXT,
  descricao_longa TEXT,
  sku TEXT,
  ean TEXT,
  ncm TEXT,
  cest TEXT,
  marca TEXT,
  categoria TEXT,
  unidade TEXT DEFAULT 'UN',
  variacoes JSONB,  -- eg. {"cor": "Azul", "tamanho": "M"}
  
  -- Prices
  preco_base NUMERIC(15,2),
  preco_promocional NUMERIC(15,2),
  custo NUMERIC(15,2),
  
  -- Stock
  controla_estoque BOOLEAN DEFAULT false,
  estoque_atual NUMERIC(15,2) DEFAULT 0,
  estoque_minimo NUMERIC(15,2) DEFAULT 0,
  local_estoque TEXT,
  
  -- Fiscal / Tributario (Brasil)
  origem_mercadoria TEXT,
  cfop_padrao TEXT,
  cst_csosn TEXT,
  aliquota_icms NUMERIC(5,2),
  aliquota_ipi NUMERIC(5,2),
  aliquota_pis NUMERIC(5,2),
  aliquota_cofins NUMERIC(5,2),
  mva_st NUMERIC(5,2),
  base_reducao_icms NUMERIC(5,2),
  tipo_tributacao TEXT,
  peso_liquido NUMERIC(10,3),
  peso_bruto NUMERIC(10,3),
  dimensoes JSONB, -- {"altura": 10, "largura": 20, "comprimento": 30}
  
  -- Media
  imagens TEXT[],
  anexos TEXT[],
  
  -- Extras
  custom_fields JSONB,
  
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_company_id_name ON products(company_id, name);
CREATE INDEX idx_products_company_id_sku ON products(company_id, sku);
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 6. company_counters
-------------------------------------------------------------------------------
CREATE TABLE company_counters (
  company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  next_order_number INT NOT NULL DEFAULT 1,
  next_quote_number INT NOT NULL DEFAULT 1
);

-------------------------------------------------------------------------------
-- Function to get the next seq number
-------------------------------------------------------------------------------
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------
-- 7. orders
-------------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'aprovado', 'faturado', 'cancelado')),
  currency TEXT DEFAULT 'BRL',
  
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  shipping_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  
  payment_method TEXT,
  payment_terms TEXT,
  notes_internal TEXT,
  notes_client TEXT,
  
  issued_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  billed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Before insert, get a sequential number
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number = get_next_order_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_order_number
BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION assign_order_number();

CREATE INDEX idx_orders_company_id_created_at ON orders(company_id, created_at);
CREATE INDEX idx_orders_company_id_status ON orders(company_id, status);
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 8. order_items
-------------------------------------------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  description_snapshot TEXT,
  ncm_snapshot TEXT,
  cfop_snapshot TEXT,
  cst_snapshot TEXT,
  
  qty NUMERIC(10,3) NOT NULL,
  unit TEXT,
  unit_price NUMERIC(15,2) NOT NULL,
  
  discount_value NUMERIC(15,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  
  icms_rate NUMERIC(5,2),
  ipi_rate NUMERIC(5,2),
  pis_rate NUMERIC(5,2),
  cofins_rate NUMERIC(5,2),
  tax_value NUMERIC(15,2) DEFAULT 0,
  
  total NUMERIC(15,2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-------------------------------------------------------------------------------
-- 9. quotes
-------------------------------------------------------------------------------
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  
  number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  
  issued_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  shipping_total NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  
  payment_terms TEXT,
  delivery_time TEXT,
  freight_type TEXT,
  carrier TEXT,
  
  notes_commercial TEXT,
  notes_fiscal TEXT,
  
  pdf_url TEXT,
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Before insert quote number
CREATE OR REPLACE FUNCTION assign_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number = get_next_quote_number(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assign_quote_number
BEFORE INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION assign_quote_number();

CREATE INDEX idx_quotes_company_id_issued_at ON quotes(company_id, issued_at);
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-------------------------------------------------------------------------------
-- 10. quote_items
-------------------------------------------------------------------------------
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- nullable para item manual
  
  name TEXT NOT NULL,
  description TEXT,
  
  ncm TEXT,
  cfop TEXT,
  cst_csosn TEXT,
  
  qty NUMERIC(10,3) NOT NULL,
  unit TEXT,
  unit_price NUMERIC(15,2) NOT NULL,
  discounts NUMERIC(15,2) DEFAULT 0,
  taxes NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-------------------------------------------------------------------------------
-- 11. attachments
-------------------------------------------------------------------------------
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'client', 'order', 'quote')),
  entity_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-------------------------------------------------------------------------------
-- RLS (ROW LEVEL SECURITY) POLICIES
-------------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Profiles: user can see/edit themselves
CREATE POLICY "Users can see all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to check if user is in company
CREATE OR REPLACE FUNCTION is_member_of(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = p_company_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is owner of company
CREATE OR REPLACE FUNCTION is_owner_of(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = p_company_id 
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Companies
CREATE POLICY "Users can view their companies" ON companies FOR SELECT USING (is_member_of(id));
CREATE POLICY "Users can create companies" ON companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their companies" ON companies FOR UPDATE USING (is_owner_of(id));
CREATE POLICY "Users can delete their companies" ON companies FOR DELETE USING (is_owner_of(id));

-- Company Members (owners can do everything, members view)
CREATE POLICY "Users can view members of their companies" ON company_members FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Owners can insert members" ON company_members FOR INSERT WITH CHECK (is_owner_of(company_id));
CREATE POLICY "Owners can update members" ON company_members FOR UPDATE USING (is_owner_of(company_id));
CREATE POLICY "Owners can delete members" ON company_members FOR DELETE USING (is_owner_of(company_id));

-- Generic Multi-Tenant Policy function
-- Many tables share the same access pattern: allow if `is_member_of(company_id)`

-- Clients
CREATE POLICY "Clients: Select" ON clients FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Clients: Insert" ON clients FOR INSERT WITH CHECK (is_member_of(company_id));
CREATE POLICY "Clients: Update" ON clients FOR UPDATE USING (is_member_of(company_id));
CREATE POLICY "Clients: Delete" ON clients FOR DELETE USING (is_member_of(company_id));

-- Products
CREATE POLICY "Products: Select" ON products FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Products: Insert" ON products FOR INSERT WITH CHECK (is_member_of(company_id));
CREATE POLICY "Products: Update" ON products FOR UPDATE USING (is_member_of(company_id));
CREATE POLICY "Products: Delete" ON products FOR DELETE USING (is_member_of(company_id));

-- Orders
CREATE POLICY "Orders: Select" ON orders FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Orders: Insert" ON orders FOR INSERT WITH CHECK (is_member_of(company_id));
CREATE POLICY "Orders: Update" ON orders FOR UPDATE USING (is_member_of(company_id));
CREATE POLICY "Orders: Delete" ON orders FOR DELETE USING (is_member_of(company_id));

-- Order Items (through orders)
CREATE POLICY "Order Items: Select" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND is_member_of(company_id))
);
CREATE POLICY "Order Items: Insert" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND is_member_of(company_id))
);
CREATE POLICY "Order Items: Update" ON order_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND is_member_of(company_id))
);
CREATE POLICY "Order Items: Delete" ON order_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND is_member_of(company_id))
);

-- Quotes
CREATE POLICY "Quotes: Select" ON quotes FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Quotes: Insert" ON quotes FOR INSERT WITH CHECK (is_member_of(company_id));
CREATE POLICY "Quotes: Update" ON quotes FOR UPDATE USING (is_member_of(company_id));
CREATE POLICY "Quotes: Delete" ON quotes FOR DELETE USING (is_member_of(company_id));

-- Quote Items
CREATE POLICY "Quote Items: Select" ON quote_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_items.quote_id AND is_member_of(company_id))
);
CREATE POLICY "Quote Items: Insert" ON quote_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_items.quote_id AND is_member_of(company_id))
);
CREATE POLICY "Quote Items: Update" ON quote_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_items.quote_id AND is_member_of(company_id))
);
CREATE POLICY "Quote Items: Delete" ON quote_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_items.quote_id AND is_member_of(company_id))
);

-- Attachments
CREATE POLICY "Attachments: Select" ON attachments FOR SELECT USING (is_member_of(company_id));
CREATE POLICY "Attachments: Insert" ON attachments FOR INSERT WITH CHECK (is_member_of(company_id));
CREATE POLICY "Attachments: Update" ON attachments FOR UPDATE USING (is_member_of(company_id));
CREATE POLICY "Attachments: Delete" ON attachments FOR DELETE USING (is_member_of(company_id));

-- Company Counters
CREATE POLICY "Company Counters: Select" ON company_counters FOR SELECT USING (is_member_of(company_id));
-- insert/update is done via SECURITY DEFINER function so RLS is bypassed.

-------------------------------------------------------------------------------
-- Storage bucket for quote-pdfs
-------------------------------------------------------------------------------
-- Note: Must be executed by superuser or you can do it via the Supabase Dashboard.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('quote-pdfs', 'quote-pdfs', false);
-- 
-- CREATE POLICY "Users can upload pdfs to their company" ON storage.objects FOR INSERT 
-- WITH CHECK (bucket_id = 'quote-pdfs' AND is_member_of( (STRING_TO_ARRAY(name, '/'))[1]::UUID ));
-- 
-- ... other storage policies

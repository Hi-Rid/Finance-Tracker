-- =====================================================
-- 016_split_bill_groups.sql
-- Groups + Groups management + Multi-receipt support
-- Idempotent: aman dijalankan berulang.
-- =====================================================

-- =====================================================
-- 1. GROUPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  color text,
  note text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_profile ON public.groups(profile_id);
CREATE INDEX IF NOT EXISTS idx_groups_user ON public.groups(user_id);

-- =====================================================
-- 2. GROUP MEMBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  is_user boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);

-- =====================================================
-- 3. EVENT_RECEIPTS - junction many-to-many
-- 1 event bisa punya banyak receipt (misal: 3x makan di hari yang sama)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_receipts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  receipt_id uuid NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, receipt_id)
);

CREATE INDEX IF NOT EXISTS idx_event_receipts_event ON public.event_receipts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_receipts_receipt ON public.event_receipts(receipt_id);

-- =====================================================
-- 4. Add group_id ke events (gak pakai receipt_id - pake junction)
-- =====================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_group ON public.events(group_id);

-- =====================================================
-- 5. RLS Policies
-- =====================================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_groups" ON public.groups;
CREATE POLICY "users_own_groups" ON public.groups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_group_members" ON public.group_members;
CREATE POLICY "users_own_group_members" ON public.group_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "users_own_event_receipts" ON public.event_receipts;
CREATE POLICY "users_own_event_receipts" ON public.event_receipts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_receipts.event_id AND e.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_receipts.event_id AND e.user_id = auth.uid())
  );

-- =====================================================
-- 6. Updated_at trigger
-- =====================================================
DROP TRIGGER IF EXISTS trg_groups_updated ON public.groups;
CREATE TRIGGER trg_groups_updated
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 7. Kategori baru: Split Bill + Settle Bill
-- =====================================================
INSERT INTO public.categories (user_id, name, type, group_name, icon, color, sort_order)
SELECT DISTINCT u.id, 'Split Bill', 'expense', 'other', 'Users', '#8b5cf6', 91
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.user_id = u.id AND c.name = 'Split Bill'
);

INSERT INTO public.categories (user_id, name, type, group_name, icon, color, sort_order)
SELECT DISTINCT u.id, 'Settle Bill', 'income', 'income', 'HandCoins', '#8b5cf6', 107
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.user_id = u.id AND c.name = 'Settle Bill'
);

-- =====================================================
-- 8. Update seed function - tambah Split Bill + Settle Bill
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.categories (user_id, name, type, group_name, icon, color, sort_order)
  values
    (p_user_id, 'Meals', 'expense', 'needs', 'UtensilsCrossed', '#334DAF', 1),
    (p_user_id, 'Coffee', 'expense', 'needs', 'Coffee', '#334DAF', 2),
    (p_user_id, 'Beverages', 'expense', 'needs', 'CupSoda', '#334DAF', 3),
    (p_user_id, 'Groceries', 'expense', 'needs', 'ShoppingBasket', '#334DAF', 4),
    (p_user_id, 'Vegetables', 'expense', 'needs', 'Salad', '#334DAF', 5),
    (p_user_id, 'Fruit', 'expense', 'needs', 'Apple', '#334DAF', 6),
    (p_user_id, 'Meat', 'expense', 'needs', 'Drumstick', '#334DAF', 7),
    (p_user_id, 'Snacks', 'expense', 'needs', 'Cookie', '#334DAF', 8),
    (p_user_id, 'Transport', 'expense', 'needs', 'Car', '#334DAF', 9),
    (p_user_id, 'Rent', 'expense', 'needs', 'Home', '#334DAF', 10),
    (p_user_id, 'Utilities', 'expense', 'needs', 'Zap', '#334DAF', 11),
    (p_user_id, 'Internet', 'expense', 'needs', 'Wifi', '#334DAF', 12),
    (p_user_id, 'Phone', 'expense', 'needs', 'Smartphone', '#334DAF', 13),
    (p_user_id, 'Hygiene', 'expense', 'needs', 'Sparkles', '#334DAF', 14),
    (p_user_id, 'Laundry', 'expense', 'needs', 'Shirt', '#334DAF', 15),
    (p_user_id, 'Medical', 'expense', 'needs', 'Pill', '#334DAF', 16),
    (p_user_id, 'Clothing', 'expense', 'wants', 'Shirt', '#f59e0b', 20),
    (p_user_id, 'Hobbies', 'expense', 'wants', 'Gamepad2', '#f59e0b', 21),
    (p_user_id, 'Entertainment', 'expense', 'wants', 'Music', '#f59e0b', 22),
    (p_user_id, 'Family', 'expense', 'wants', 'Users', '#f59e0b', 23),
    (p_user_id, 'Thrifting', 'expense', 'wants', 'ShoppingBag', '#f59e0b', 24),
    (p_user_id, 'Fitness', 'expense', 'wants', 'Dumbbell', '#f59e0b', 25),
    (p_user_id, 'Sports', 'expense', 'wants', 'Trophy', '#f59e0b', 26),
    (p_user_id, 'Gaming', 'expense', 'wants', 'Gamepad', '#f59e0b', 27),
    (p_user_id, 'Travel', 'expense', 'wants', 'Plane', '#f59e0b', 28),
    (p_user_id, 'Beauty', 'expense', 'wants', 'Palette', '#f59e0b', 29),
    (p_user_id, 'Shoes', 'expense', 'wants', 'Footprints', '#f59e0b', 30),
    (p_user_id, 'Hotel', 'expense', 'wants', 'Bed', '#f59e0b', 31),
    (p_user_id, 'Pets', 'expense', 'wants', 'PawPrint', '#f59e0b', 32),
    (p_user_id, 'Membership', 'expense', 'wants', 'BadgeCheck', '#f59e0b', 33),
    (p_user_id, 'Digital', 'expense', 'wants', 'Camera', '#f59e0b', 34),
    (p_user_id, 'Stocks', 'expense', 'invest', 'TrendingUp', '#10b981', 40),
    (p_user_id, 'Crypto', 'expense', 'invest', 'Bitcoin', '#10b981', 41),
    (p_user_id, 'Mutual Fund', 'expense', 'invest', 'LineChart', '#10b981', 42),
    (p_user_id, 'Gold', 'expense', 'invest', 'Coins', '#10b981', 43),
    (p_user_id, 'Bond', 'expense', 'invest', 'FileText', '#8b5cf6', 44),
    (p_user_id, 'Loan', 'expense', 'debt', 'HandCoins', '#ef4444', 50),
    (p_user_id, 'Paylater', 'expense', 'debt', 'CreditCard', '#ef4444', 51),
    (p_user_id, 'Biaya Transfer', 'expense', 'other', 'ArrowRightLeft', '#64748b', 90),
    (p_user_id, 'Split Bill', 'expense', 'other', 'Users', '#8b5cf6', 91),
    (p_user_id, 'Donation', 'expense', 'donation', 'Gift', '#ef4444', 60),
    (p_user_id, 'Tax', 'expense', 'tax', 'FileText', '#ef4444', 61),
    (p_user_id, 'Zakat', 'expense', 'zakat', 'Heart', '#ef4444', 62),
    (p_user_id, 'Other', 'expense', 'other', 'Circle', '#64748b', 99),
    (p_user_id, 'Salary', 'income', 'income', 'Wallet', '#10b981', 100),
    (p_user_id, 'Side Job', 'income', 'income', 'Briefcase', '#10b981', 101),
    (p_user_id, 'Bonus', 'income', 'income', 'Award', '#10b981', 102),
    (p_user_id, 'Dividend', 'income', 'income', 'LineChart', '#10b981', 103),
    (p_user_id, 'Gift', 'income', 'income', 'Gift', '#10b981', 104),
    (p_user_id, 'Transfer In', 'income', 'income', 'ArrowDownRight', '#10b981', 105),
    (p_user_id, 'Penyesuaian Saldo', 'income', 'other', 'Calculator', '#64748b', 106),
    (p_user_id, 'Settle Bill', 'income', 'income', 'HandCoins', '#8b5cf6', 107),
    (p_user_id, 'Other Income', 'income', 'income', 'Circle', '#10b981', 199);
end;
$function$;
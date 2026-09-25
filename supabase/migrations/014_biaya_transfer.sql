-- =====================================================
-- 014_transfer_fee_category.sql
-- Kategori "Biaya Transfer" untuk expense fee transfer
-- Idempotent
-- =====================================================

-- 1. Update seed function — tambah kategori
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
    (p_user_id, 'Loan', 'expense', 'debt', 'HandCoins', '#ef4444', 50),
    (p_user_id, 'Paylater', 'expense', 'debt', 'CreditCard', '#ef4444', 51),
    (p_user_id, 'Biaya Transfer', 'expense', 'other', 'ArrowRightLeft', '#64748b', 90),
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
    (p_user_id, 'Other Income', 'income', 'income', 'Circle', '#10b981', 199);
end;
$function$;

-- 2. Insert untuk user existing (idempotent)
INSERT INTO public.categories (user_id, name, type, group_name, icon, color, sort_order)
SELECT 
  u.id,
  'Biaya Transfer',
  'expense',
  'other',
  'ArrowRightLeft',
  '#64748b',
  90
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM categories c
  WHERE c.user_id = u.id AND c.name = 'Biaya Transfer'
);

-- 3. Verify
SELECT 'kategori_created' AS status, COUNT(*) AS total
FROM categories WHERE name = 'Biaya Transfer';
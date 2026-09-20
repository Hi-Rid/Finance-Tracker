-- =====================================================
-- 008_rls.sql
-- Enable RLS + policies untuk semua tabel
-- =====================================================

-- =====================================================
-- ENABLE RLS DI SEMUA TABEL
-- =====================================================
alter table public.user_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.contacts enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_tags enable row level security;
alter table public.audit_logs enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_items enable row level security;
alter table public.event_item_shares enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.envelopes enable row level security;
alter table public.envelope_transactions enable row level security;
alter table public.daily_budget_items enable row level security;
alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_saving_plans enable row level security;
alter table public.recurring enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.assets enable row level security;
alter table public.asset_valuations enable row level security;
alter table public.investment_details enable row level security;
alter table public.investment_transactions enable row level security;
alter table public.tax_records enable row level security;
alter table public.zakat_records enable row level security;
alter table public.documents enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_budget_items enable row level security;
alter table public.trip_checklist_items enable row level security;
alter table public.gifts enable row level security;
alter table public.milestones enable row level security;
alter table public.currencies enable row level security;
alter table public.exchange_rates enable row level security;

-- =====================================================
-- POLICIES: Tabel dengan user_id langsung
-- User hanya bisa akses data milik sendiri
-- =====================================================
create policy "users_own_user_settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_profiles" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_tags" on public.tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_contacts" on public.contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_audit_logs" on public.audit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_debts" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_envelopes" on public.envelopes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_daily_budget_items" on public.daily_budget_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_wishlists" on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_recurring" on public.recurring
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_reminders" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_assets" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_tax_records" on public.tax_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_zakat_records" on public.zakat_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_trips" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_gifts" on public.gifts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_milestones" on public.milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================
-- POLICIES: Tabel child (akses via parent)
-- =====================================================

-- transaction_tags: via transactions
create policy "users_own_transaction_tags" on public.transaction_tags
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_tags.transaction_id
        and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_tags.transaction_id
        and t.user_id = auth.uid()
    )
  );

-- event_participants: via events
create policy "users_own_event_participants" on public.event_participants
  for all using (
    exists (select 1 from public.events e where e.id = event_participants.event_id and e.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_participants.event_id and e.user_id = auth.uid())
  );

-- event_items: via events
create policy "users_own_event_items" on public.event_items
  for all using (
    exists (select 1 from public.events e where e.id = event_items.event_id and e.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.events e where e.id = event_items.event_id and e.user_id = auth.uid())
  );

-- event_item_shares: via event_items → events
create policy "users_own_event_item_shares" on public.event_item_shares
  for all using (
    exists (
      select 1 from public.event_items ei
      join public.events e on e.id = ei.event_id
      where ei.id = event_item_shares.item_id and e.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.event_items ei
      join public.events e on e.id = ei.event_id
      where ei.id = event_item_shares.item_id and e.user_id = auth.uid()
    )
  );

-- debt_payments: via debts
create policy "users_own_debt_payments" on public.debt_payments
  for all using (
    exists (select 1 from public.debts d where d.id = debt_payments.debt_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.debts d where d.id = debt_payments.debt_id and d.user_id = auth.uid())
  );

-- envelope_transactions: via envelopes
create policy "users_own_envelope_transactions" on public.envelope_transactions
  for all using (
    exists (select 1 from public.envelopes e where e.id = envelope_transactions.envelope_id and e.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.envelopes e where e.id = envelope_transactions.envelope_id and e.user_id = auth.uid())
  );

-- goal_contributions: via goals
create policy "users_own_goal_contributions" on public.goal_contributions
  for all using (
    exists (select 1 from public.goals g where g.id = goal_contributions.goal_id and g.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.goals g where g.id = goal_contributions.goal_id and g.user_id = auth.uid())
  );

-- wishlist_saving_plans: via wishlists
create policy "users_own_wishlist_saving_plans" on public.wishlist_saving_plans
  for all using (
    exists (select 1 from public.wishlists w where w.id = wishlist_saving_plans.wishlist_id and w.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_saving_plans.wishlist_id and w.user_id = auth.uid())
  );

-- asset_valuations: via assets
create policy "users_own_asset_valuations" on public.asset_valuations
  for all using (
    exists (select 1 from public.assets a where a.id = asset_valuations.asset_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.assets a where a.id = asset_valuations.asset_id and a.user_id = auth.uid())
  );

-- investment_details: via assets
create policy "users_own_investment_details" on public.investment_details
  for all using (
    exists (select 1 from public.assets a where a.id = investment_details.asset_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.assets a where a.id = investment_details.asset_id and a.user_id = auth.uid())
  );

-- investment_transactions: via assets
create policy "users_own_investment_transactions" on public.investment_transactions
  for all using (
    exists (select 1 from public.assets a where a.id = investment_transactions.asset_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.assets a where a.id = investment_transactions.asset_id and a.user_id = auth.uid())
  );

-- trip_members: via trips
create policy "users_own_trip_members" on public.trip_members
  for all using (
    exists (select 1 from public.trips t where t.id = trip_members.trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_members.trip_id and t.user_id = auth.uid())
  );

-- trip_budget_items: via trips
create policy "users_own_trip_budget_items" on public.trip_budget_items
  for all using (
    exists (select 1 from public.trips t where t.id = trip_budget_items.trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_budget_items.trip_id and t.user_id = auth.uid())
  );

-- trip_checklist_items: via trips
create policy "users_own_trip_checklist_items" on public.trip_checklist_items
  for all using (
    exists (select 1 from public.trips t where t.id = trip_checklist_items.trip_id and t.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.trips t where t.id = trip_checklist_items.trip_id and t.user_id = auth.uid())
  );

-- =====================================================
-- POLICIES: Tabel publik read-only (currencies, exchange_rates)
-- =====================================================
create policy "currencies_read_all" on public.currencies
  for select using (true);

create policy "exchange_rates_read_all" on public.exchange_rates
  for select using (true);

create policy "exchange_rates_insert_auth" on public.exchange_rates
  for insert with check (auth.uid() is not null);
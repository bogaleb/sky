-- Sky — atomic wallet and daily-quest operations.
--
-- awardStars / spendStars were previously read-modify-write in the server
-- actions, which loses updates under concurrent calls. These functions do
-- the update in a single statement so concurrent calls can't clobber each
-- other. bump_quest_progress likewise bumps progress atomically and reports
-- whether THIS call newly completed the quest, so the one-time completion
-- bonus is awarded exactly once.
--
-- Convention (matches the other RPCs in this schema): SECURITY DEFINER with
-- a fixed search_path, ownership verified inside the function via auth.uid(),
-- revoked from anon/public and granted to authenticated.

-- ---------------------------------------------------------------------------
-- award_stars: add stars to a child's wallet. Returns the new balance.
-- ---------------------------------------------------------------------------
create or replace function public.award_stars(p_child_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  if p_amount <= 0 then
    select balance into v_balance from public.star_balances where child_id = p_child_id;
    return coalesce(v_balance, 0);
  end if;
  insert into public.star_balances (child_id, balance, lifetime_earned)
  values (p_child_id, p_amount, p_amount)
  on conflict (child_id) do update
    set balance = public.star_balances.balance + excluded.balance,
        lifetime_earned = public.star_balances.lifetime_earned + excluded.lifetime_earned,
        updated_at = now()
  returning balance into v_balance;
  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- spend_stars: spend stars if the balance covers it. Returns true on success.
-- The balance check and debit happen in one statement: two concurrent spends
-- can never overdraw the wallet.
-- ---------------------------------------------------------------------------
create or replace function public.spend_stars(p_child_id uuid, p_amount integer)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  if p_amount <= 0 then
    return true;
  end if;
  update public.star_balances
  set balance = balance - p_amount,
      updated_at = now()
  where child_id = p_child_id
    and balance >= p_amount;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- bump_quest_progress: add to a daily quest's progress, clamped to its goal.
-- Returns the new progress, whether the quest is complete, and whether this
-- call newly completed it (exact for sequential and same-row concurrent
-- calls thanks to the row lock; best-effort if two sessions create the row
-- at the exact same instant).
-- ---------------------------------------------------------------------------
create or replace function public.bump_quest_progress(
  p_child_id uuid,
  p_quest_date date,
  p_quest_id text,
  p_amount integer,
  p_goal integer
)
returns table (
  progress integer,
  completed boolean,
  newly_completed boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_was_completed boolean := false;
  v_progress integer;
  v_completed boolean;
  v_amount integer := least(greatest(coalesce(p_amount, 0), 0), p_goal);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  -- Lock the existing row (when present) so a concurrent bump for the same
  -- quest serializes behind us and sees our update.
  select q.completed into v_was_completed
  from public.quest_progress q
  where q.child_id = p_child_id
    and q.quest_date = p_quest_date
    and q.quest_id = p_quest_id
  for update;

  insert into public.quest_progress
    (child_id, quest_date, quest_id, progress, goal, completed, completed_at)
  values (
    p_child_id,
    p_quest_date,
    p_quest_id,
    v_amount,
    p_goal,
    v_amount >= p_goal,
    case when v_amount >= p_goal then now() else null end
  )
  on conflict (child_id, quest_date, quest_id) do update
  set progress = least(
        public.quest_progress.progress + excluded.progress,
        public.quest_progress.goal
      ),
      completed = least(
        public.quest_progress.progress + excluded.progress,
        public.quest_progress.goal
      ) >= public.quest_progress.goal,
      completed_at = case
        when least(
               public.quest_progress.progress + excluded.progress,
               public.quest_progress.goal
             ) >= public.quest_progress.goal
         and not public.quest_progress.completed
        then now()
        else public.quest_progress.completed_at
      end
  returning
    public.quest_progress.progress,
    public.quest_progress.completed
  into v_progress, v_completed;

  progress := v_progress;
  completed := v_completed;
  newly_completed := v_completed and not coalesce(v_was_completed, false);
  return next;
end;
$$;

revoke all on function public.award_stars(uuid, integer) from anon, public;
revoke all on function public.spend_stars(uuid, integer) from anon, public;
revoke all on function public.bump_quest_progress(uuid, date, text, integer, integer) from anon, public;
grant execute on function public.award_stars(uuid, integer) to authenticated;
grant execute on function public.spend_stars(uuid, integer) to authenticated;
grant execute on function public.bump_quest_progress(uuid, date, text, integer, integer) to authenticated;

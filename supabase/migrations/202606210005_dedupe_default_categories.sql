begin;

create temporary table category_duplicate_map on commit drop as
select duplicate_id, keeper_id
from (
  select
    id as duplicate_id,
    first_value(id) over (
      partition by user_id, localization_key, type
      order by created_at, id
    ) as keeper_id,
    row_number() over (
      partition by user_id, localization_key, type
      order by created_at, id
    ) as duplicate_rank
  from public.categories
  where is_default = true
    and localization_key is not null
) ranked
where duplicate_rank > 1;

update public.categories child
set parent_id = duplicate_map.keeper_id
from category_duplicate_map duplicate_map
where child.parent_id = duplicate_map.duplicate_id;

update public.recurring_rules item
set category_id = duplicate_map.keeper_id
from category_duplicate_map duplicate_map
where item.category_id = duplicate_map.duplicate_id;

update public.transactions item
set category_id = duplicate_map.keeper_id
from category_duplicate_map duplicate_map
where item.category_id = duplicate_map.duplicate_id;

update public.budget_items item
set category_id = duplicate_map.keeper_id
from category_duplicate_map duplicate_map
where item.category_id = duplicate_map.duplicate_id;

update public.subscriptions item
set category_id = duplicate_map.keeper_id
from category_duplicate_map duplicate_map
where item.category_id = duplicate_map.duplicate_id;

delete from public.categories category
using category_duplicate_map duplicate_map
where category.id = duplicate_map.duplicate_id;

alter table public.categories
  add constraint categories_user_localization_type_key
  unique (user_id, localization_key, type);

commit;

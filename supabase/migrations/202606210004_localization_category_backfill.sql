begin;

update public.categories
set localization_key = case
  when type = 'income' then 'other_income'
  else 'other_expense'
end
where localization_key is null
  and is_default = true
  and lower(name) = 'lainnya';

commit;

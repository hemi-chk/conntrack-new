alter table public.orders
  add column if not exists pickup_latitude numeric,
  add column if not exists pickup_longitude numeric,
  add column if not exists destination_latitude numeric,
  add column if not exists destination_longitude numeric;

alter table public.orders
  add constraint orders_pickup_latitude_range
    check (pickup_latitude is null or pickup_latitude between -90 and 90),
  add constraint orders_pickup_longitude_range
    check (pickup_longitude is null or pickup_longitude between -180 and 180),
  add constraint orders_destination_latitude_range
    check (destination_latitude is null or destination_latitude between -90 and 90),
  add constraint orders_destination_longitude_range
    check (destination_longitude is null or destination_longitude between -180 and 180);
-- Neyrlo: database-side notification event creation for messages and listing request lifecycle events.

create or replace function public.neyrlo_message_notification_event()
returns trigger
language plpgsql
as $$
declare
  convo record;
  target_user uuid;
begin
  select c.id, c.listing_id, c.owner_id, c.requester_id, coalesce(l.title, 'Ilmoitus') as title
  into convo
  from public.conversations c
  left join public.listings l on l.id = c.listing_id
  where c.id = new.conversation_id;

  if convo.id is null then
    return new;
  end if;

  if new.sender_id = convo.owner_id then
    target_user := convo.requester_id;
  else
    target_user := convo.owner_id;
  end if;

  if target_user is null or target_user = new.sender_id then
    return new;
  end if;

  if exists (
    select 1
    from public.notification_events e
    where e.type = 'message'
      and e.user_id = target_user
      and e.actor_id = new.sender_id
      and e.data ->> 'messageId' = new.id::text
  ) then
    return new;
  end if;

  insert into public.notification_events (user_id, actor_id, type, title, body, data)
  values (
    target_user,
    new.sender_id,
    'message',
    'Uusi viesti: ' || convo.title,
    left(new.body, 240),
    jsonb_build_object('conversationId', convo.id, 'listingId', convo.listing_id, 'messageId', new.id)
  );

  return new;
end;
$$;

drop trigger if exists neyrlo_message_notification_event_trigger on public.messages;
create trigger neyrlo_message_notification_event_trigger
after insert on public.messages
for each row
execute function public.neyrlo_message_notification_event();

create or replace function public.neyrlo_request_notification_event()
returns trigger
language plpgsql
as $$
declare
  item_title text;
  target_user uuid;
  event_type text;
  event_title text;
  event_body text;
begin
  select coalesce(title, 'Ilmoitus') into item_title
  from public.listings
  where id = new.listing_id;

  item_title := coalesce(item_title, 'Ilmoitus');

  if tg_op = 'INSERT' then
    target_user := new.owner_id;
    event_type := 'request';
    event_title := 'Uusi pyyntö: ' || item_title;
    event_body := coalesce(new.message, 'Uusi pyyntö odottaa vastausta.');
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status::text in ('cancelled', 'returned') then
      target_user := new.owner_id;
    else
      target_user := new.requester_id;
    end if;

    event_type := case new.status::text
      when 'accepted' then 'request_accepted'
      when 'declined' then 'request_declined'
      when 'cancelled' then 'request_cancelled'
      when 'pickup_scheduled' then 'pickup_scheduled'
      when 'picked_up' then 'picked_up'
      when 'return_due' then 'return_due'
      when 'returned' then 'returned'
      when 'completed' then 'request_completed'
      else null
    end;

    event_title := item_title || ': ' || case new.status::text
      when 'accepted' then 'Hyväksytty'
      when 'declined' then 'Hylätty'
      when 'cancelled' then 'Peruttu'
      when 'pickup_scheduled' then 'Nouto sovittu'
      when 'picked_up' then 'Noudettu'
      when 'return_due' then 'Palautus tulossa'
      when 'returned' then 'Palautettu'
      when 'completed' then 'Valmis'
      else 'Päivitetty'
    end;

    event_body := case new.status::text
      when 'accepted' then 'Pyyntö hyväksyttiin. Sopikaa nouto ja palautus viesteissä.'
      when 'declined' then 'Pyyntö hylättiin.'
      when 'cancelled' then 'Pyyntö peruttiin.'
      when 'pickup_scheduled' then 'Nouto on sovittu.'
      when 'picked_up' then 'Tavara on merkitty noudetuksi.'
      when 'return_due' then 'Palautuspäivä lähestyy.'
      when 'returned' then 'Tavara on merkitty palautetuksi.'
      when 'completed' then 'Tapahtuma on valmis.'
      else 'Pyyntö päivitettiin.'
    end;
  else
    return new;
  end if;

  if target_user is null or event_type is null then
    return new;
  end if;

  if exists (
    select 1
    from public.notification_events e
    where e.user_id = target_user
      and e.type = event_type
      and e.data ->> 'requestId' = new.id::text
      and e.data ->> 'status' = coalesce(new.status::text, '')
  ) then
    return new;
  end if;

  insert into public.notification_events (user_id, actor_id, type, title, body, data)
  values (
    target_user,
    auth.uid(),
    event_type,
    event_title,
    left(event_body, 240),
    jsonb_build_object('listingId', new.listing_id, 'requestId', new.id, 'status', new.status::text)
  );

  return new;
end;
$$;

drop trigger if exists neyrlo_request_notification_event_insert_trigger on public.listing_requests;
create trigger neyrlo_request_notification_event_insert_trigger
after insert on public.listing_requests
for each row
execute function public.neyrlo_request_notification_event();

drop trigger if exists neyrlo_request_notification_event_update_trigger on public.listing_requests;
create trigger neyrlo_request_notification_event_update_trigger
after update of status on public.listing_requests
for each row
execute function public.neyrlo_request_notification_event();

-- Add proposal_view to channel enum check constraint
ALTER TABLE public.lead_inquiries DROP CONSTRAINT IF EXISTS lead_inquiries_channel_check;
ALTER TABLE public.lead_inquiries ADD CONSTRAINT lead_inquiries_channel_check CHECK (channel IN ('form', 'phone_click', 'proposal_view'));

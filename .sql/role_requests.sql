CREATE TABLE public.role_requests (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL CHECK (requested_role IN ('tester', 'developer', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, requested_role)
);

-- Create an index for faster queries
CREATE INDEX idx_role_requests_user_id ON public.role_requests(user_id);
CREATE INDEX idx_role_requests_status ON public.role_requests(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own requests
CREATE POLICY "Users can view their own role requests"
  ON public.role_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own requests
CREATE POLICY "Users can insert their own role requests"
  ON public.role_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
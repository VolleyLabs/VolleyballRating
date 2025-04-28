-- Function to extract admin role from JWT claims
CREATE OR REPLACE FUNCTION public.jwt_claim_admin() 
RETURNS TABLE (role text) 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.app_metadata.role', TRUE), '') AS role;
$$;

COMMENT ON FUNCTION public.jwt_claim_admin() IS 'Helper function that extracts the admin role from JWT claims for RLS policies.'; 
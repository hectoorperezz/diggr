-- Create a SQL function to execute dynamic SQL for migrations
-- This function should only be callable by the service role
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Revoke all permissions from public
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role; 
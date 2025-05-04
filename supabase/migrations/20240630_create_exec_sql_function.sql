-- Migration to add exec_sql function to the database
-- This function allows executing arbitrary SQL commands from migrations

-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execution privileges to authorized roles
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO postgres;

-- Add comment explaining function purpose
COMMENT ON FUNCTION public.exec_sql(text) IS 'Function to execute arbitrary SQL statements. Used by migration scripts.'; 
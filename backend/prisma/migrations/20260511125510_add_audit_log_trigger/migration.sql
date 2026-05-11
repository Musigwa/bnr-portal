-- Create a function that throws an exception
CREATE OR REPLACE FUNCTION block_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
   RAISE EXCEPTION 'Modifying or deleting audit logs is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

-- Attach the function as a trigger to the AuditLog table
CREATE TRIGGER enforce_audit_log_worm
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH STATEMENT
EXECUTE FUNCTION block_audit_log_modification();

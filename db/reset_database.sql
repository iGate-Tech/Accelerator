-- WARNING: This will permanently delete ALL tables and data in the 'public' schema. Run with caution!

DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Get all tables in public schema
    FOR table_name IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', table_name;
    END LOOP;
END $$;
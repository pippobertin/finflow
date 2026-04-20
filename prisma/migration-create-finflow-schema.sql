-- V2 Migration: Create the "finflow" schema for new V2 entities.
-- V1 tables remain in "public" schema with fin_* prefix.
-- V2 tables will live in "finflow" schema without prefix.
-- Both coexist until end of Phase 3, when public.fin_* is retired.
--
-- Executed: 2026-04-20

CREATE SCHEMA IF NOT EXISTS finflow;

-- Grant usage to the connection role so Prisma can operate on it
GRANT USAGE ON SCHEMA finflow TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA finflow TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA finflow GRANT ALL ON TABLES TO postgres;

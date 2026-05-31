docker exec -it supabase_db_scr psql -U postgres -d custodycore


\pset pager off
(Run this first so the terminal doesn't cut off long outputs).

\dt
(This will list your 11 primary tables: cases, evidence_items, custody_transfers, etc.)

\d evidence_items
(This will show all the columns, the NOT NULL rules, and the Foreign Keys connecting it to cases).

\d custody_transfers
(Show this to emphasize how the chain of custody audit is physically built).

\dT
(This will show all your custom ENUM types like evidence_status and personnel_role).

\dv
(This will show the view vw_evidence_audit_trail that you created).

To exit the database when you are done:
Type \q and hit Enter.


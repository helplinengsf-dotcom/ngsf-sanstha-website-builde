# Sanstha Builder — independent project starter

This repository is intended for a multi-organization website-builder product. It is independent of the existing NGSF website, repository and Supabase project.

## Included
- Responsive landing page and starter template previews
- Local-only organization setup modal
- Initial separate Supabase schema is provided in `supabase/schema.sql` when ready to add the backend

## Current status
This is a front-end prototype. The setup form does not save or send data. Login is a visual placeholder; no real accounts are enabled.

## Next steps
1. Create a **new Supabase project** dedicated to Sanstha Builder.
2. Review and run the schema only in that new project.
3. Implement owner onboarding, tenant-safe Row Level Security, public published-content reads, and private storage.
4. Test with at least two organizations and separate user accounts before production.
5. Configure hosting and domain routing for subdomains and custom domains.

Never run new-project SQL in the existing NGSF Admin project. Never expose a service-role key in browser code. Do not enter real personal or member data into this prototype.

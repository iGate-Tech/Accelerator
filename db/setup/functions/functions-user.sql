-- User Management Functions Setup
-- Functions for user lifecycle, profiles, and account management
-- Handles authentication, registration, and user data operations
--
-- FUNCTIONS INCLUDED (4 total):
-- - manage_user_profile: CRUD operations for user profiles
-- - handle_user_registration: New user onboarding process
-- - update_user_package: Subscription package management
-- - load_user_context: Session data aggregation
--
-- DEPENDENCY LEVEL: High (used by authentication and user-facing features)
-- Called frequently during user sessions and account management

-- Include individual user management function files
\i db/functions/manage_user_profile.sql
\i db/functions/handle_user_registration.sql
\i db/functions/update_user_package.sql
\i db/functions/load_user_context.sql
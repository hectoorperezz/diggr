# Supabase Auth Settings for Development

For development, you may want to disable email confirmation to make testing easier. Here's how to do it:

## Disable Email Confirmation in Supabase Dashboard

1. Go to your Supabase project dashboard: https://app.supabase.com/project/llkaervhlvqygjhqbvec/auth/users

2. Navigate to Authentication → Settings → Auth Providers → Email

3. Uncheck "Enable email confirmations" option

4. Save changes

## Check Triggers and Functions

If users still aren't appearing in your database:

1. Go to Database → Tables → auth.users and check if users are being created here

2. Go to Database → Tables → public.users and see if any records exist

3. Check if the trigger is working by running this SQL in the SQL Editor:
   ```sql
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'on_auth_user_created';
   ```

4. If the trigger isn't working, you can manually run this query after creating a user:
   ```sql
   INSERT INTO public.users (id, email)
   SELECT id, email FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.users);
   ```

## Testing User Registration

After making these changes:

1. Register a new user
2. Check console logs for the signup response
3. Check Database → Tables → auth.users to see if the user was created
4. Check Database → Tables → public.users to see if the trigger created a record

If users appear in auth.users but not public.users, it could be an issue with the trigger function. 
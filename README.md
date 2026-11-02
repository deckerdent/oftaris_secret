# This is Oftaris Secret 

Oftaris Secret is a treasure hunt through Oftersheim, the 1250 years old town somewhere in Baden-Württemberg (Germany). The treasure hunt is a game for children and adults, where you have to solve riddles and find the hidden treasure of the romans used to live here. The game is based on the history of Oftersheim and historical facts with, of course, small ajustments to make it more fun.

# The Actual History 

Oftersheim is a small town in Baden-Württemberg with a history that goes back to the roman empire. Back in the 1960s the ancient ruins of at least two houses were discovered. Many years later franconian settlers settled in the very same area. One of them most possibly "Oftari" from which todays town name "Oftersheim" (Oftaris Home) is derived. Oftari is said to have settled in the area around the 7-8th century. The official first recording of the towns name goes back to the Lorscher Codex from 766 bc, which makes Oftersheim at least roughly 1250 years old. Discover more on the history of Oftersheim on the [official website](https://www.oftersheim.de/) or the [wikipedia page](https://de.wikipedia.org/wiki/Oftersheim).

# The Legend

Oftari, the founder of the small village of Oftersheim, was more than a farmer. He was a leader with unusual skills for his time: he could read, and even write a little. He kept a diary in which he recorded the encounters that shaped his life.

One day, so the legend goes, he found a map among the ruins of the Roman villa that had stood there long before his time. He was certain it would lead to a treasure. Despite all his efforts, he never found it. In the end he gave up, returned the map to where he had found it, and wrote in his diary that it should rest there until someone else came along with better luck.

Centuries later, in the 1790s, local historians discovered the diary during an excavation. They found Oftari's notes about the map and the place where he had found it, and shared their discovery with the mayor, who understood the danger at once. A treasure rush would ruin the village. Together with a few trusted members of the council, they removed the revealing page from the diary and founded the **Order of the Keepers of Oftari's Secret**.

For generations the Order guarded the secret, passing it from one member to the next. Then, in the 1940s, the Nazis learned of the secret society and set out to find the treasure. Under immense pressure, one captured member gave up the hiding place of the diary page:

> *"Where they once laid their dead to rest, in the middle of the village, there you will find the page."*

The other Order members learned of the abduction and acted quickly. When the Nazis reached the site, they found no diary page, only a typewritten letter that mocked their efforts. The page had long been moved to another place.

Since then, its trail has gone cold.

# The Game

Now it's on the players to find the hidden gem no one found since the romans left it there. It's a treasure hunt through the village of Oftersheim.

## The Rules 
- Do not remove the hints, put them back where you found them for other players to find them as well
- Do not alter codes, texts or hints
- Do not destroy anything
- Be responsible while playing

## Tools

It is commonly known that secret orders like to hide messages from their enemies by applying special inks. So you should be prepared to use a UV light. 

## Internationalization

The UI uses Vue I18n with English and German messages in `src/locales/`. The selected language is saved in browser storage; on first use, the app uses a supported browser language or falls back to English. When adding a locale, add its messages and register it in `src/i18n.ts` so it is available in the language selector.

## Styling

The app uses Web Awesome components and `wa-*` custom elements. Its default theme is copied into `src/assets/webawesome/styles/` with the relative palette and layer files it imports; make visual theme overrides in that local copy. The app follows the operating system's light or dark color preference and updates when that preference changes.

## Authentication

Sign-in uses Google OAuth through Supabase with the PKCE flow. Enable Google as an auth provider in Supabase and allow both the local app base URL and deployed app base URL (including `/oftaris_secret/`) in Supabase's redirect URL settings. Keep the provider secret in Supabase; only the public anon key belongs in the frontend environment.

## Supabase comments

Database changes live in `supabase/migrations/`. The initial migration creates public, readable comment threads, with each root comment serving as its thread. Authenticated users can create comments, edit their own comments, and soft-delete their own comments; admins can soft-delete any comment. Thread and comment reactions are separate, and each user has one like or dislike per target. Likes add one to the target's net score; dislikes subtract one.

Comment ownership, reaction records, user roles, and profiles (email, display name, and avatar URL) are stored in the `private` schema. The generated `supabase/config.toml` exposes only `public` and `graphql_public`; keep `private` out of the Supabase project's exposed API schemas. The Data API exposes no author or voter identifiers. Reaction totals and the current user's reaction are available through the `get_comment_reaction_summaries` and `get_thread_reaction_summaries` RPCs. Use `set_comment_reaction`, `set_thread_reaction`, and `delete_comment` for writes.

Admin roles must be provisioned by a trusted operator in the Supabase SQL editor or another trusted database connection, never through the frontend:

```sql
INSERT INTO private.user_roles (user_id, role)
VALUES ('<auth.users.id>', 'admin');
```

Apply migrations with the Supabase CLI after linking the project (`npx supabase link --project-ref <project-ref>`), then run `npx supabase db push`. For local development, use `npx supabase start` and `npx supabase db reset`.

For manual UI testing in VS Code, run the `Supabase: Start Local Discussion Board` task. It resets the local database, applies migrations, and starts Vite on port 5174 using the local Supabase API without changing `.env.local`. Open `http://127.0.0.1:5174/oftaris_secret/#/discussions`; run `Supabase: Stop Local Stack` when finished. The reset deletes existing local database data. Local development shows a test-account sign-in/sign-up option; it is available only when Vite is in development mode and uses a localhost Supabase URL.
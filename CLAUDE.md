# gender-equality-un-data (GE / UN Data)

Next.js 16 + React 19 + TypeScript site at https://ge-un-tyj.vercel.app (repo `taeyjeong/ge-un-tyj`, Vercel project `ge-un-tyj`, deploys on push to `main`). Supabase project `gender-equality-un-data` (ref `xqfkcrizdblybpalzdyw`); it isn't shared with other apps. The workspace rules in `../CLAUDE.md` apply.

## Data docs (read before changing data, the AI chat or a join)

@docs/ai-data.md
@docs/website-data.md
@docs/data-connections.md

Keep these three files current. When a dataset, AI tool or join changes, update the matching doc in the same change.

## Other docs

- [README.md](README.md): pages, running locally, deployment
- [DATA_DICTIONARY.md](DATA_DICTIONARY.md): HDR 2025 column prefixes
- [supabase/README.md](supabase/README.md): notebook storage and Supabase setup
- [public/index-sources/README.md](public/index-sources/README.md): MPI, GHI and EPI source files

## Working notes

- Check types with `npx tsc --noEmit`. To check the production build, build in a clean git worktree with `npm ci && npm run build`.
- Python scripts with pandas use `../DataScience/.venv/bin/python`.
- Supabase migrations: `supabase db push --linked --dry-run` first, then ask before applying to production.
- The project log (`lib/project-log.ts`) is public at `/project-log`. Add an `updates` entry for each shipped change.

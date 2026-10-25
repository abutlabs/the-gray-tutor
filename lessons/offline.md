# Working offline

Everything in the tutorial runs on your own machine, so you can work on a flight, as long
as you download what it needs while you're still online. One command, in the tutorial's
folder, does all of it:

```sh
npm run offline
```

The first run takes a while, because the test vectors are about 1.4 GB. After that it only
fetches what's new. **Run it again after every `git pull`**, while you're online: a new
lesson can bring a new package, and a package that isn't on your machine can't be fetched
in the air.

## What it fetches

It does four things, in this order. If one fails, it carries on with the rest, and the
list at the end says which are ready:

```text
Ready for the plane?
  ✔ the tutorial's packages
  ✔ your client's packages (@types/node@26.6.4 typescript@7.0.2 @noble/hashes@2.4.0 @noble/curves@2.4.0 @typeberry/native@0.5.1-4e90642)
  ✔ the test vectors
  ✔ the stack's Docker images
```

1. **The tutorial's packages**, which run the website and the tools. It runs `npm install`
   in the tutorial's folder.
2. **Your client's packages**: every package any lesson adds to `client/package.json`,
   at the version the lesson pins. That's TypeScript and Node's types from
   [lesson 0.2](./00-start/02-set-up-the-project.md), plus the cryptography libraries from
   [5.1](./05-hashing-and-signatures/01-hashes.md),
   [5.3](./05-hashing-and-signatures/03-signatures.md) and
   [8.8](./08-safrole/08-the-ring-root.md). It reads the list from the lessons
   themselves, so it's never out of date. They go into npm's cache, by installing them
   into a scratch folder that is deleted afterwards, so `client/` isn't touched and can
   be at any lesson. Then it installs them a second time with `--offline`, which proves
   the cache really holds all of them.
3. **The test vectors**, with `npm run vectors`.
4. **The stack's Docker images**, by running `./obs up` in `../observability`. Docker
   keeps the images, so the stack starts later without the network. Start Docker
   Desktop first. The command needs the observability repository cloned next to the
   tutorial, as [lesson 0.2](./00-start/02-set-up-the-project.md#the-observability-stack)
   does.

If a step fails, the list says why: `✘ the stack's Docker images: ./obs up failed: is
Docker running?`. Fix that, run `npm run offline` again, and it quickly re-checks the
steps that already worked.

## On the plane

- **Where a lesson says `npm install`, type `npm install --offline`.** npm then takes
  everything from its cache and doesn't wait for a network that isn't there.
- **`npm run demo`** runs `npm install` itself, so tell it to stay offline:
  `npm_config_offline=true npm run demo`.
- **`./obs up`** works as usual, from the images Docker already has.
- **The website**, `npm run site`, needs no network. Only its links to other sites do:
  GitHub, and the Gray Paper's reader.
- **Don't run `npm run vectors` or `npm run offline`.** They fetch from the network, so
  they fail in the air. The vectors you already have are still there.

## What you have

Everything the tutorial needs, on your machine: its packages, your client's packages in
npm's cache, the vectors and the stack's images. Run `npm run offline` again after each
pull to keep it that way.

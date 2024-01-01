# `@irclogs/api`

Typescript API to access the IrcLog CouchDB database. Mostly typed wrappers over the http api of CouchDB.


## Quick start for users

```
echo "@irclogs:registry=https://npm.pkg.github.com" >> .npmrc
npm install @irclogs/api
# or
yarn add @irclogs/api
# or
pnpm add @irclogs/api
```

## API Playground

See https://irclogs.github.io/api/ to interactively play with the api in your browser.

To use the playground locally run:
```
pnpm install
pnpm playground:types
pnpm play
```
and open http://localhost:8000


## References

- https://docs.couchdb.org/en/stable/api/ddoc/views.html#db-design-design-doc-view-view-name
- https://github.com/irclogs/couchapp
- https://github.com/gdamjan/erlang-irc-bot

## TODO:

- naming: class name?
- documentation
- package publish check auto-versioning schema
- validation on responses and typing (use zod)

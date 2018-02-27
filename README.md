# Instructions

```
git clone git@github.com:aguynamedben/pouchdb-bug.git
cd pouchdb-bug
yarn build && yarn test
```

## Versions (see package.json)
pouchdb: 6.3.4
pouchdb-upsert: 2.0.0

# Problem

This is the sequence that happens in Tester:

- We setup 2 PouchDB databases: upstreamDB and downstreamDB.
- We index 3 documents in downstreamDB. These documents have URLs like http://mysite.com/doc1
- We setup replication from upstreamDB to downstreamDB. Documents and changes added up upstreamDB should make their way to downstreamDB.
- We setup a listener to inspect changes on downstreamDB. This will allow us to respond to changes coming into downstreamDB.
- We make updates in upstreamDB, expecting them to propagate to downstreamDB. These update change the URL format from http://mysite.com/doc1 to http://mysite.com/changed/doc1

This is where things become surprising.

We have a change listener on downstreamDB. We observe that sometimes a change comes in with the URL structure http://mysite.com/doc1 when we expect the changed URL structure to be http://mysite.com/changed/doc1. This seems intermittent. Sometimes changes come in with an old URL, sometimes changes come in with a new URL.

At the end of the process, we analyze the data in downstreamDB at rest. We observe that the data is in an inconsistent state given the changes we've sent. Like the change feed, we see some docs with the old URL format and some docs with the new URL format.

You can run `yarn build && yarn test` multiple times and see the output is different each time.

# Real-world Problem

My app depends on the PouchDB Changes API to know when to re-index data in other systems (i.e. a search index). I noticed that data in my search index was stale. Upon further inspection, data in my downstream database was also stale. I tested a bunch with passing data into the upstream database, watching it go to the downstream database, and seeing that the behavior of replication and the changes API was inconsistent.

Thanks for your hard work on PouchDB. I love it. Let me know what I can do to help diagnose the cause of this problem. Apologies if I'm misuing the database. I've read the docs a bunch of times and think this is a bug.

# Example Output (multiple runs)

```
Sequence!ben:/Users/ben/code/pouchdb-bug$ yarn build && yarn test
yarn run v1.3.2
$ babel src -d lib
src/Tester.js -> lib/Tester.js
src/index.js -> lib/index.js
✨  Done in 0.56s.
yarn run v1.3.2
$ node ./lib/index.js
Tester inited
========== initialIndexing() ==========
Upserted doc 1 in this.downstreamDB { updated: true, rev: '1-8f515e0a01d1400788878e36490287e1' }
Upserted doc 2 in this.downstreamDB { updated: true, rev: '1-3dc482f1c094458a8d50e4a6acb254ea' }
Upserted doc 3 in this.downstreamDB { updated: true, rev: '1-a2253af8e19d435cae15a75a327be61a' }
Initial indexing finished
========== startReplication() ==========
========== createUpstreamDBChanges() ==========
Upserted doc 1 in this.upstreamDB { updated: true, rev: '1-39e1230707904e94a7d8fc03000b9b48' }
Upserted doc 2 in this.upstreamDB { updated: true, rev: '1-dcc171238abe41e7ab12096566d0e1e2' }
Upserted doc 3 in this.upstreamDB { updated: true, rev: '1-23f138235162408b8e6ea7c60351c5e3' }
Done creating upstream changes
CHANGE -  { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-8f515e0a01d1400788878e36490287e1' }
CHANGE -  { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-dcc171238abe41e7ab12096566d0e1e2' }
CHANGE -  { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-a2253af8e19d435cae15a75a327be61a' }
========== analyzeData() ==========
RESULT { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-8f515e0a01d1400788878e36490287e1' }
RESULT { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-dcc171238abe41e7ab12096566d0e1e2' }
RESULT { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-a2253af8e19d435cae15a75a327be61a' }
All done!
✨  Done in 3.43s.
```

```
Sequence!ben:/Users/ben/code/pouchdb-bug$ yarn build && yarn test
yarn run v1.3.2
$ babel src -d lib
src/Tester.js -> lib/Tester.js
src/index.js -> lib/index.js
✨  Done in 0.57s.
yarn run v1.3.2
$ node ./lib/index.js
Tester inited
========== initialIndexing() ==========
Upserted doc 1 in this.downstreamDB { updated: true, rev: '1-10832e0e3ae3485084fce8724be0c414' }
Upserted doc 2 in this.downstreamDB { updated: true, rev: '1-088447ac96dc42658ee53e3bd5579d00' }
Upserted doc 3 in this.downstreamDB { updated: true, rev: '1-ff4720e26e5a45a7aa4dd23a75b6dd75' }
Initial indexing finished
========== startReplication() ==========
========== createUpstreamDBChanges() ==========
Upserted doc 1 in this.upstreamDB { updated: true, rev: '1-dc70cfc636124293b9da0b7b394881b4' }
Upserted doc 2 in this.upstreamDB { updated: true, rev: '1-97bcdf85081944c9a59dec727e0fd3e7' }
Upserted doc 3 in this.upstreamDB { updated: true, rev: '1-cc11a25714b349b489d8d1d3963229c5' }
Done creating upstream changes
CHANGE -  { title: 'Doc 1',
  url: 'http://mysite.com/changed/doc1',
  _id: '1',
  _rev: '1-dc70cfc636124293b9da0b7b394881b4' }
CHANGE -  { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-97bcdf85081944c9a59dec727e0fd3e7' }
CHANGE -  { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-ff4720e26e5a45a7aa4dd23a75b6dd75' }
========== analyzeData() ==========
RESULT { title: 'Doc 1',
  url: 'http://mysite.com/changed/doc1',
  _id: '1',
  _rev: '1-dc70cfc636124293b9da0b7b394881b4' }
RESULT { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-97bcdf85081944c9a59dec727e0fd3e7' }
RESULT { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-ff4720e26e5a45a7aa4dd23a75b6dd75' }
All done!
✨  Done in 3.43s.
```

```
Sequence!ben:/Users/ben/code/pouchdb-bug$ yarn build && yarn test
yarn run v1.3.2
$ babel src -d lib
src/Tester.js -> lib/Tester.js
src/index.js -> lib/index.js
✨  Done in 0.57s.
yarn run v1.3.2
$ node ./lib/index.js
Tester inited
========== initialIndexing() ==========
Upserted doc 1 in this.downstreamDB { updated: true, rev: '1-8e8852d59fc345b6ac87c5fdcf5cf0a1' }
Upserted doc 2 in this.downstreamDB { updated: true, rev: '1-e4b441957427445ebc05f09a2a8fb94c' }
Upserted doc 3 in this.downstreamDB { updated: true, rev: '1-f3f261c89f844054bf521f8bd0372908' }
Initial indexing finished
========== startReplication() ==========
========== createUpstreamDBChanges() ==========
Upserted doc 1 in this.upstreamDB { updated: true, rev: '1-093d3fb5b8d7437c914ba80bfd47544c' }
Upserted doc 2 in this.upstreamDB { updated: true, rev: '1-53efac6313d349f7a9852d7332e1cb6b' }
Upserted doc 3 in this.upstreamDB { updated: true, rev: '1-8506f790bc7c4b6f9b75c408727588e8' }
Done creating upstream changes
CHANGE -  { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-8e8852d59fc345b6ac87c5fdcf5cf0a1' }
CHANGE -  { title: 'Doc 2',
  url: 'http://mysite.com/doc2',
  _id: '2',
  _rev: '1-e4b441957427445ebc05f09a2a8fb94c' }
CHANGE -  { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-f3f261c89f844054bf521f8bd0372908' }
========== analyzeData() ==========
RESULT { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-8e8852d59fc345b6ac87c5fdcf5cf0a1' }
RESULT { title: 'Doc 2',
  url: 'http://mysite.com/doc2',
  _id: '2',
  _rev: '1-e4b441957427445ebc05f09a2a8fb94c' }
RESULT { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-f3f261c89f844054bf521f8bd0372908' }
All done!
✨  Done in 3.42s.
```

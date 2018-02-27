# Instructions

```
git clone git@github.com:aguynamedben/pouchdb-bug.git
cd pouchdb-bug
yarn build && yarn test
```

## Versions (see package.json)
- pouchdb: 6.3.4
- pouchdb-upsert: 2.0.0

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

# Example Output

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
Upserted doc 1 in this.downstreamDB { updated: true, rev: '1-b7460083bb3843febd5290d459600144' }
Upserted doc 2 in this.downstreamDB { updated: true, rev: '1-43c574ac83bb452e87b5f83417e7b887' }
Upserted doc 3 in this.downstreamDB { updated: true, rev: '1-e9caabbc78ef412f9b947749acf79136' }
Initial indexing finished
========== startReplication() ==========
========== createUpstreamDBChanges() ==========
Upserted doc 1 in this.upstreamDB { updated: true, rev: '1-502322b86df84f8c9fbc438b8af32a04' }
Upserted doc 2 in this.upstreamDB { updated: true, rev: '1-485cd706cf2f42efb0386f1677033ba4' }
Upserted doc 3 in this.upstreamDB { updated: true, rev: '1-cc66469291cd4ec9808a47f22a47ccae' }
Done creating upstream changes
CHANGE -  { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-b7460083bb3843febd5290d459600144' }
CHANGE -  { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-485cd706cf2f42efb0386f1677033ba4' }
CHANGE -  { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-e9caabbc78ef412f9b947749acf79136' }
========== analyzeData() ==========
===== Showing upstreamDB docs =====
UPSTREAM DOC { title: 'Doc 1',
  url: 'http://mysite.com/changed/doc1',
  _id: '1',
  _rev: '1-502322b86df84f8c9fbc438b8af32a04' }
UPSTREAM DOC { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-485cd706cf2f42efb0386f1677033ba4' }
UPSTREAM DOC { title: 'Doc 3',
  url: 'http://mysite.com/changed/doc3',
  _id: '3',
  _rev: '1-cc66469291cd4ec9808a47f22a47ccae' }
===== Showing downstreamDB docs =====
DOWNSTREAM DOC { title: 'Doc 1',
  url: 'http://mysite.com/doc1',
  _id: '1',
  _rev: '1-b7460083bb3843febd5290d459600144' }
DOWNSTREAM DOC { title: 'Doc 2',
  url: 'http://mysite.com/changed/doc2',
  _id: '2',
  _rev: '1-485cd706cf2f42efb0386f1677033ba4' }
DOWNSTREAM DOC { title: 'Doc 3',
  url: 'http://mysite.com/doc3',
  _id: '3',
  _rev: '1-e9caabbc78ef412f9b947749acf79136' }
✨  Done in 3.41s.
Sequence!ben:/Users/ben/code/pouchdb-bug$
```

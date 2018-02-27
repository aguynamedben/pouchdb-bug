import PouchDB from 'pouchdb';
import pouchdbUpsert from 'pouchdb-upsert';
import rimraf from 'rimraf';
import util from 'util';

PouchDB.plugin(pouchdbUpsert);

rimraf.sync('downstreamDB');
rimraf.sync('upstreamDB');

class Tester {
  downstreamDB = null;
  upstreamDB = null;

  constructor() {
    console.log('Tester inited');
  }

  start() {
    this.downstreamDB = new PouchDB('downstreamDB');
    this.upstreamDB = new PouchDB('upstreamDB');

    return Promise.resolve()
      .then(() => this.initialIndexing())
      .then(() => {
        console.log(`Initial indexing finished`);
      })
      .then(() => this.startReplication())
      .then(() => this.listenForDownstreamDBChanges())
      .then(() => this.createUpstreamDBChanges())
      .then(() => {
        console.log(`Done creating upstream changes`);
      })
      .then(() => this.analyzeData())
      .catch((error) => {
        console.log(`Tester - Problem starting: ${error}`);
      });
  }

  initialIndexing() {
    console.log(`========== initialIndexing() ==========`);
    const initialDocs = [
      { _id: '1', title: 'Doc 1', url: 'http://mysite.com/doc1' },
      { _id: '2', title: 'Doc 2', url: 'http://mysite.com/doc2' },
      { _id: '3', title: 'Doc 3', url: 'http://mysite.com/doc3' },
    ];

    const promises = initialDocs.map((initialDoc) => {
      return this.downstreamDB
        .upsert(initialDoc._id, doc => initialDoc)
        .then((res) => {
          console.log(`Upserted doc ${initialDoc._id} in this.downstreamDB`, res);
        })
        .catch((error) => {
          console.log(`Error upserting: ${error}`);
          throw error;
        });
    });

    return Promise.all(promises);
  }

  startReplication() {
    console.log(`========== startReplication() ==========`);
    const options = { live: true, retry: true };

    this.upstreamDBHandler = this.upstreamDB.replicate.to(this.downstreamDB, options);
  }

  handleChange = (change) => {
    if (change.deleted) {
      console.log(`Tester - Document in this.downstreamDB deleted, doing nothing (not implemented)`);
    } else {
      console.log(`CHANGE - `, change.doc);
    }
  }

  listenForDownstreamDBChanges() {
    const changeSettings = { since: 'now', live: true, include_docs: true };
    this.downstreamDB.changes(changeSettings)
      .on('change', this.handleChange);
    this.downstreamDB
  }

  createUpstreamDBChanges() {
    console.log(`========== createUpstreamDBChanges() ==========`);
    const updatedDocs = [
      { _id: '1', title: 'Doc 1', url: 'http://mysite.com/changed/doc1' },
      { _id: '2', title: 'Doc 2', url: 'http://mysite.com/changed/doc2' },
      { _id: '3', title: 'Doc 3', url: 'http://mysite.com/changed/doc3' },
    ];

    const promises = updatedDocs.map((updatedDoc) => {
      return this.upstreamDB.upsert(updatedDoc._id, doc => updatedDoc)
        .then((res) => {
          console.log(`Upserted doc ${updatedDoc._id} in this.upstreamDB`, res);
        })
        .catch((error) => {
          console.log(`Error upserting: ${error}`);
          throw error;
        });
    });

    return Promise.all(promises);
  }

  analyzeData() {
    const setTimeoutPromise = util.promisify(setTimeout);
    // Sleep just... to be sure?
    setTimeoutPromise(3000).then(() => {
      console.log(`========== analyzeData() ==========`);
      const upstreamPromises = [
        this.upstreamDB.get('1').then((doc) => console.log('UPSTREAM DOC', doc)),
        this.upstreamDB.get('2').then((doc) => console.log('UPSTREAM DOC', doc)),
        this.upstreamDB.get('3').then((doc) => console.log('UPSTREAM DOC', doc)),
      ];
      const downstreamPromises = [
        this.downstreamDB.get('1').then((doc) => console.log('DOWNSTREAM DOC', doc)),
        this.downstreamDB.get('2').then((doc) => console.log('DOWNSTREAM DOC', doc)),
        this.downstreamDB.get('3').then((doc) => console.log('DOWNSTREAM DOC', doc)),
      ];

      Promise.resolve()
        .then(() => console.log('===== Showing upstreamDB docs ====='))
        .then(() => Promise.all(upstreamPromises))
        .then(() => console.log('===== Showing downstreamDB docs ====='))
        .then(() => Promise.all(downstreamPromises));
    });
  }
}

export default Tester;

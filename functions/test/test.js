
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const assert = chai.assert;
chai.use(chaiAsPromised);

const admin = require('firebase-admin');
const functions = require('firebase-functions-test')();

describe('Cloud Functions for Bookcrossing Mobile', () => {
  let myFunctions,
    databaseStub,
    adminInitStub;

  beforeEach(() => {
    functions.mockConfig({
      algolia: {
        app: 'app',
        key: 'key',
        index: 'test_books'
      },
      maps: {
        key: 'key'
      }
    });
    adminInitStub = sinon.stub(admin, 'initializeApp');
    databaseStub = sinon.stub(admin, 'database')
    .get(() => { 
      return function() { 
          return 'data';
        }
      });
    myFunctions = require('../index');
  });

  after(() => {
    adminInitStub.restore();
    databaseStub.restore();
    functions.cleanup();
  })
});

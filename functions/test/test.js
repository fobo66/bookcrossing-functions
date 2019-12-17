
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

  describe('resolveBookLocation', () => {

    it('should create new reference for every change of the location', () => {
      const resolveBookLocation = functions.wrap(myFunctions.resolveBookLocation);

      const refStub = sinon.stub();
      const childStub = sinon.stub();
      const setStub = sinon.stub();
      const setArg = {
        lat: 40.714224,
        lng: -73.961452,
      };

      setStub.withArgs(setArg).returns(true);
      childStub.withArgs('Brooklyn').returns({ set: setStub });
      refStub.withArgs('/places/book').returns({ child: childStub });
      databaseStub.returns({ ref: () => refStub });

      const fakeData = functions.database.makeDataSnapshot({
        book: {
          positionName: 'Googleplex',
          city: 'Mountain View',
        },
        auth: {
          uid: 'jckS2Q0'
        },
        authType: 'USER'
      }, '/books/book');

      return assert.equal(resolveBookLocation(fakeData), true);
    });
  });
});


const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const assert = chai.assert;
chai.use(chaiAsPromised);

describe('Cloud Functions:', () => {
  let myFunctions,
    configStub,
    adminInitStub,
    functions,
    admin;

  before(() => {
    admin = require('firebase-admin');
    adminInitStub = sinon.stub(admin, 'initializeApp');
    functions = require('firebase-functions');
    configStub = sinon.stub(functions, 'config').returns({
      firebase: {
        databaseURL: 'https://not-a-project.firebaseio.com',
        storageBucket: 'not-a-project.appspot.com',
      },
    });
    myFunctions = require('../index');
  });

  after(() => {
    configStub.restore();
    adminInitStub.restore();
  });

  describe('resolveBookLocation', () => {
    it('should resolve latlng', () => {
      const mapsClient = require('@google/maps').createClient({
        key: 'AIzaSyAbKJO_8xquY3FzGBNIGtigMV3DBGqaWqM',
      });

      mapsClient.geocode({
        address: 'Brooklyn',
      }, (err, response) => {
        assert.eventually.isNull(err);
        assert.eventually.isNotNull(response);
        assert.eventually.isArray(response.json.results);
        assert.eventually.isDefined(response.json.results[0].geometry.location);
      }
      );
    });

    it('should create new reference for every change of the location', () => {
      const fakeEvent = {
        data: new functions.database.DeltaSnapshot(null, null, null, {
          book: {
            position: 'Grand St/Bedford Av, Brooklyn, NY 11211, США',
          }
        }),
        params: {
          bookKey: 'book',
        },
      };

      const refStub = sinon.stub();
      const childStub = sinon.stub();
      const setStub = sinon.stub();
      const setArg = {
        lat: 40.714224,
        lng: -73.961452,
      };

      const databaseStub = sinon.stub(admin, 'database');

      setStub.withArgs(setArg).returns(true);
      childStub.withArgs('Brooklyn').returns({ set: setStub });
      refStub.withArgs('/places/book').returns({ child: childStub });
      Object.defineProperty(fakeEvent.data, 'ref', { get: refStub });
      databaseStub.returns({ ref: refStub });

      return assert.eventually.equal(myFunctions.resolveBookLocation(fakeEvent), true);
    });
  });
});

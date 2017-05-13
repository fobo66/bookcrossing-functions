
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const assert = chai.assert;
chai.use(chaiAsPromised);

describe('Retrieving book location', () => {
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
});

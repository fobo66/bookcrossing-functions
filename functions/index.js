const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mapsClient = require('@google/maps').createClient({
  key: 'AIzaSyAbKJO_8xquY3FzGBNIGtigMV3DBGqaWqM',
});

admin.initializeApp(functions.config().firebase);

exports.resolveBookLocation = functions.database.ref('/books/{city}/{bookKey}')
    .onWrite((event) => {
      const key = event.params.bookKey;
      const placesRef = admin.database().ref(`/places/${key}`);
      let location = {};
      let error = new Error();

      const book = event.data.val();
      const rawPosition = book.position;

      mapsClient.geocode({
        address: rawPosition,
      }, (err, response) => {
        if (!err) {
          location = response.json.results[0].geometry.location;
        } else {
          error = err;
        }
      });

      if (location !== undefined) {
        return placesRef.child(rawPosition).set(location);
      }

      return Promise.reject(error);
    });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mapsClient = require('@google/maps').createClient({
  key: 'AIzaSyAbKJO_8xquY3FzGBNIGtigMV3DBGqaWqM',
});

admin.initializeApp(functions.config().firebase);

exports.resolveBookLocation = functions.database.ref('/books/{bookKey}')
    .onWrite((event) => {
      const placesRef = admin.database().ref(`/places/${event.params.bookKey}`);
      let location = '';
      let error = {};

      const book = event.data.val();

      mapsClient.geocode({
        address: book.position,
      }, (err, response) => {
        if (!err) {
          location = response.json.geometry.location;
        } else {
          error = err;
        }
      });

      if (location.length !== 0) {
        return placesRef.child(book.position).set(location);
      }

      return Promise.reject(error);
    });

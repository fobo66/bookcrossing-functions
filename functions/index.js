const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mapsClient = require('@google/maps').createClient({
  key: 'AIzaSyAbKJO_8xquY3FzGBNIGtigMV3DBGqaWqM',
});

admin.initializeApp(functions.config().firebase);

exports.resolveBookLocation = functions.database.ref('/books/{bookKey}')
    .onWrite((event) => {
      const placesRef = functions.database.ref(`places/${event.params.bookKey}`);
      const location = [];

      if (event.data.previous.exists()) {
        location.push(...event.data.previous.val());
      }

      if (!event.data.exists()) {
        return placesRef.remove();
      }

      const book = event.data.val();

      mapsClient.geocode({
        address: book.position,
      }, (err, response) => {
        if (!err) {
          location.push(response.json.geometry.location);
        }
      });

      return placesRef.set(location);
    });

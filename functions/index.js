const functions = require('firebase-functions');
const admin = require('firebase-admin');
const promisify = require('es6-promisify');
const mapsClient = require('@google/maps').createClient({
  key: functions.config().maps.key,
});

admin.initializeApp(functions.config().firebase);

const geocode = promisify(mapsClient.geocode, {
  thisArg: mapsClient,
});

const findPlace = promisify(mapsClient.places, {
  thisArg: mapsClient,
});

exports.resolveBookLocation = functions.database.ref('/books/{bookKey}')
    .onWrite((event) => {
      const key = event.params.bookKey;
      const placesRef = admin.database().ref(`/places/${key}`);
      const placesHistoryRef = admin.database().ref(`/placesHistory/${key}`);

      if (event.data.exists()) {
        const book = event.data.val();
        const city = book.city;
        const rawPosition = book.positionName;

        return geocode({
          address: city,
        })
        .then(response => findPlace({
          query: rawPosition,
          location: response.json.results[0].geometry.location,
          radius: 10000,
        })
        ).then((response) => {
          const location = response.json.results[0].geometry.location;
          event.data.ref.child('position').set(location);
          placesHistoryRef.child(`${city}, ${rawPosition}`).set(location);
          return placesRef.set(location);
        });
      }

      return placesRef.remove()
      .then(() => placesHistoryRef.remove());
    });

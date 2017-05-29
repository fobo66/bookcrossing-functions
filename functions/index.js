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

exports.resolveBookLocation = functions.database.ref('/books/{city}/{bookKey}')
    .onWrite((event) => {
      const key = event.params.bookKey;
      const city = event.params.city;
      const placesRef = admin.database().ref(`/places/${key}`);

      const book = event.data.val();
      const rawPosition = book.position;

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
        return placesRef.set(location);
      });
    });

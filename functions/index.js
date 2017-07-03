const functions = require('firebase-functions');
const admin = require('firebase-admin');
const promisify = require('es6-promisify');
const mapsClient = require('@google/maps').createClient({
  key: functions.config().maps.key,
});

const algoliasearch = require('algoliasearch');
const algoliaFunctions = require('algolia-firebase-functions');

const algolia = algoliasearch(functions.config().algolia.app,
                              functions.config().algolia.key);
const index = algolia.initIndex(functions.config().algolia.index);

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

exports.stashedBooksNotifications = functions.database.ref('/books/{bookKey}/free')
  .onWrite((event) => {
    const key = event.params.bookKey;
    const payload = {
      data: {
        key,
      },
      notification: {
        titleLocKey: '',
        bodyLocKey: '',
      },
    };
    if (event.data.val() === true && event.data.previous.val() === false) {
      payload.notification.titleLocKey = 'stash_notification_title_acquired';
      payload.notification.bodyLocKey = 'stash_notification_body_acquired';
    } else if (event.data.val() === false && event.data.previous.val() === true) {
      payload.notification.titleLocKey = 'stash_notification_title_free';
      payload.notification.bodyLocKey = 'stash_notification_body_free';
    }

    return admin.messaging().sendToTopic(key, payload);
  });

exports.syncAlgoliaWithFirebase = functions.database.ref('/books/{bookKey}').onWrite(
  event => algoliaFunctions.syncAlgoliaWithFirebase(index, event)
);

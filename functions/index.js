const functions = require('firebase-functions');
const admin = require('firebase-admin');
const mapsClient = require('@google/maps').createClient({
  key: functions.config().maps.key,
  Promise: Promise
});

const algoliasearch = require('algoliasearch');
const algoliaFunctions = require('algolia-firebase-functions');

const algolia = algoliasearch(functions.config().algolia.app,
                              functions.config().algolia.key);
const index = algolia.initIndex(functions.config().algolia.index);

admin.initializeApp();

exports.resolveBookLocation = functions.database.ref('/books/{bookKey}')
    .onWrite((data, context) => {
      const key = context.params.bookKey;
      const placesRef = admin.database().ref(`/places/${key}`);
      const placesHistoryRef = admin.database().ref(`/placesHistory/${key}`);

      if (data.after.exists()) {
        const book = data.after.val();
        const city = book.city;
        const rawPosition = book.positionName;

        return mapsClient.geocode({
          address: city,
        })
        .asPromise()
        .then(response => mapsClient.places({
          query: rawPosition,
          location: response.json.results[0].geometry.location,
          radius: 10000,
        })
        .asPromise()
        ).then((response) => {
          const location = response.json.results[0].geometry.location;
          data.ref.child('position').set(location);
          placesHistoryRef.child(`${city}, ${rawPosition}`).set(location);
          return placesRef.set(location);
        });
      }

      return placesRef.remove()
      .then(() => placesHistoryRef.remove());
    });

exports.stashedBooksNotifications = functions.database.ref('/books/{bookKey}/free')
  .onWrite((change, context) => {
    const key = context.params.bookKey;
    const payload = {
      data: {
        key,
      },
      notification: {
        titleLocKey: '',
        bodyLocKey: '',
      },
    };
    if (change.after.val() === true && change.before.val() === false) {
      payload.notification.titleLocKey = 'stash_notification_title_acquired';
      payload.notification.bodyLocKey = 'stash_notification_body_acquired';
    } else if (change.after.val() === false && change.before.val() === true) {
      payload.notification.titleLocKey = 'stash_notification_title_free';
      payload.notification.bodyLocKey = 'stash_notification_body_free';
    }

    return admin.messaging().sendToTopic(key, payload);
  });

exports.syncAlgoliaWithFirebase = functions.database.ref('/books/{bookKey}').onWrite(
  (change, context) => algoliaFunctions.syncAlgoliaWithFirebase(index, change)
);

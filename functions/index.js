const functions = require('firebase-functions');
const admin = require('firebase-admin');

const algoliasearch = require('algoliasearch');
const algoliaFunctions = require('algolia-firebase-functions');

const algolia = algoliasearch(functions.config().algolia.app,
                              functions.config().algolia.key);
const index = algolia.initIndex(functions.config().algolia.index);

admin.initializeApp();

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

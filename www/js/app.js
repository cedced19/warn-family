phonon.options({
    navigator: {
        defaultPage: 'home',
        animatePages: true,
        templateRootDirectory: 'views/',
        enableBrowserBackButton: true
    },
    i18n: {
        directory: 'langs/',
        localeFallback: 'en'
    }
});

var language = localStorage.getItem('language') || (window.navigator.userLanguage || window.navigator.language).split('-')[0];
phonon.updateLocale(language);

// Request permission with success callback and sentence
var requestPermission = function (permission, sentence, cb) {
  var errorCallback = function () {
    phonon.i18n().get([sentence, 'error', 'ok'], function(values) {
      phonon.alert(values[sentence], values['error'], false, values['ok']);
      cb(true);
    });
  };
  cordova.plugins.permissions.requestPermission(permission, function (status) {
      if(!status.hasPermission) errorCallback();
      cb(null);
  }, errorCallback);
};

document.addEventListener('deviceready', function () {
      // Send location to every contact selected
      var sendLocation = function (location, cb) {
        phonon.i18n().get('location_message', function(value) {
          var contacts = JSON.parse(localStorage.getItem('contacts'));
          var message = value + ': ' + location.latitude + ' ' + location.longitude + ' https://www.google.fr/maps/place/' + location.latitude + '+' + location.longitude;
          contacts.forEach(function (contact) {
            SMS.sendSMS(contact.phone, message, function () {}, console.warn);
          });
          cb();
        });
      };


      // Define background function
      var successCallback = function(location) {
          sendLocation(location, function () {
            backgroundGeolocation.finish();
          });
      };

      var failureCallback = console.warn;

      phonon.i18n().get('sharing_informations', function(value) {
        backgroundGeolocation.configure(successCallback, failureCallback, {
            interval: 150000,
            fastestInterval: 30000,
            activitiesInterval: 150000,
            stopOnTerminate: false,
            startOnBoot: false,
            startForeground: true,
            stopOnStillActivity: true,
            locationProvider: backgroundGeolocation.provider.ANDROID_ACTIVITY_PROVIDER,
            notificationTitle: 'Warn Family',
            notificationText: value + '...',
            notificationIconLarge: 'icon',
            notificationIconSmall: 'icon',
            stationaryRadius: 50,
            distanceFilter: 50,
            desiredAccuracy: 10,
            debug: false,
            saveBatteryOnBackground: false
        });
      });
}, false);

phonon.navigator().on({page: 'home', content: 'home.html', preventClose: false, readyDelay: 0}, function(activity) {

    activity.onCreate(function () {
      var checkPermission = function (permission, errorSentence, cb) {
          cordova.plugins.permissions.hasPermission(cordova.plugins.permissions[permission], function (status) {
            if(!status.hasPermission) {
              requestPermission(cordova.plugins.permissions[permission], errorSentence, cb);
            } else {
              cb(null);
            }
          }, null);
      };

      var enableBtn = document.getElementById('enable-btn');
      var disableBtn = document.getElementById('disable-btn');
      var watchId;

      enableBtn.onclick = function () {
        // Request send SMS and Geolocation permission, check if there is contacts and if location enabled
        asyncWaterfall([
          function (cb) {
            checkPermission('ACCESS_FINE_LOCATION', 'no_other_permissions', cb);
          },
          function (cb) {
            checkPermission('SEND_SMS', 'no_other_permissions', cb);
          },
          function (cb) {
            var contacts = JSON.parse(localStorage.getItem('contacts'));
            if (typeof contacts == 'undefined' || !Array.isArray(contacts) || !contacts.length) {
              phonon.i18n().get(['no_contact_selected', 'error', 'ok'], function(values) {
                phonon.alert(values['no_contact_selected'], values['error'], false, values['ok']);
                cb(true);
              });
            } else {
              cb(null);
            }
          },
          function (cb) {
            backgroundGeolocation.isLocationEnabled(function (enabled) {
              if (enabled) {
                cb(null);
              } else {
                phonon.i18n().get(['location_disabled', 'error', 'ok', 'cancel'], function(values) {
                  var confirm = phonon.confirm(values['location_disabled'], values['error'], true, values['ok'], values['cancel']);
                  confirm.on('confirm', function() {
                    backgroundGeolocation.showLocationSettings();
                    cb(true);
                  });
                  confirm.on('cancel', function() {
                    cb(true);
                  });
                });
              }
            });
          }
        ], function (err) {
          if (!err) {
            backgroundGeolocation.start(function () {
              enableBtn.style.display = 'none';
              disableBtn.style.display = 'block';
              }, function (error) {
                // Location updates are not authorized
                if (error.code === 2) {
                  phonon.i18n().get(['location_updates_not_authorized', 'error', 'ok', 'cancel'], function(values) {
                    var confirm = phonon.confirm(values['location_updates_not_authorized'], values['error'], true, values['ok'], values['cancel']);
                    confirm.on('confirm', function() {
                      backgroundGeolocation.showAppSettings();
                    });
                  });
                }
            });
          }
        });
      };

      disableBtn.onclick = function () {
        enableBtn.style.display = 'block';
        disableBtn.style.display = 'none';
        backgroundGeolocation.stop();
      };

    });
});

phonon.navigator().on({page: 'number-list', content: 'number-list.html', preventClose: false, readyDelay: 0}, function(activity) {

    activity.onCreate(function () {
      var addContactBtn = document.getElementById('add-contact-btn');
      var ul = document.getElementById('contacts-list');
      var contacts = JSON.parse(localStorage.getItem('contacts'));

      var showContact = function (value, index) {
        var li = document.createElement('li');
        li.setAttribute('id', 'contact-' + index);

        var a = document.createElement('a');
        a.className = 'pull-right icon icon-close';
        a.on('click', function () {
          ul.removeChild(document.getElementById('contact-' + index));
          contacts.splice(contacts.indexOf(value), 1);
          localStorage.setItem('contacts', JSON.stringify(contacts));
        });
        li.appendChild(a);

        var span = document.createElement('span');
        span.className = 'padded-list';
        span.appendChild(document.createTextNode(value.name));
        li.appendChild(span);

        ul.appendChild(li);
      };

      // Request read contact permission
      cordova.plugins.permissions.hasPermission(cordova.plugins.permissions.READ_CONTACTS, function (status) {
        if(!status.hasPermission) {
          var informationDiv = document.getElementById('request-contacts-permission');
          var requestBtn = document.getElementById('request-contacts-permission-btn');
          informationDiv.style.display = 'block';
          addContactBtn.style.display = 'none';
          requestBtn.onclick = function () {
            requestPermission(cordova.plugins.permissions.READ_CONTACTS, 'no_contacts_permission', function () {
              informationDiv.style.display = 'none';
              addContactBtn.style.display = 'block';
            });
          }
        }
      }, null);

      addContactBtn.onclick = function () {
        navigator.contacts.pickContact(function(contact){
          if (!Array.isArray(contacts)) {
            contacts = [];
          }
          var contact = {
            phone: contact.phoneNumbers[0].value,
            name: contact.displayName
          };
          contacts.push(contact);
          localStorage.setItem('contacts', JSON.stringify(contacts));
          showContact(contact, contacts.length-1);
        }, null);
      };

      if (Array.isArray(contacts)) {
        contacts.forEach(showContact);
      }
    });
});

phonon.navigator().on({ page: 'language', content: 'language.html', preventClose: false, readyDelay: 0 }, function (activity) {

    activity.onCreate(function () {
        var radios = document.querySelectorAll('input[name=language]');
        document.querySelector('#language-btn').on('click', function () {
            for (var i in radios) {
                if (radios[i].checked) {
                    localStorage.setItem('language', radios[i].value);
                    phonon.updateLocale(radios[i].value);
                    language = radios[i].value;
                    break;
                }
            }
            phonon.i18n().get(['language_confirm', 'information', 'ok'], function (values) {
                phonon.alert(values.language_confirm, values.information, false, values.ok);
            });
        });
    });

    activity.onReady(function () {
        var radios = document.querySelectorAll('input[name=language]');
        for (var i in radios) {
            if (radios[i].value == language) {
                radios[i].checked = true;
                break;
            }
        }
    });
});


phonon.i18n().bind();
phonon.navigator().start();

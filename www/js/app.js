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
  var errorCallback = function() {
    phonon.i18n().get([sentence, 'warning', 'ok'], function(values) {
      phonon.alert(values[sentence], values['warning'], false, values['ok']);
    });
  };

  cordova.plugins.permissions.requestPermission(permission,
  function(status) {
    if(!status.hasPermission) errorCallback();
    cb();
  }, errorCallback);
};

phonon.navigator().on({page: 'home', content: 'home.html', preventClose: false, readyDelay: 0}, function(activity) {

    activity.onReady(function () {

    });
});

phonon.navigator().on({page: 'number-list', content: 'number-list.html', preventClose: false, readyDelay: 0}, function(activity) {

    activity.onReady(function () {
      cordova.plugins.permissions.hasPermission(cordova.plugins.permissions.SEND_SMS, function () {
        if(!status.hasPermission) {
          requestPermission(cordova.plugins.permissions.SEND_SMS, 'no_permission_sms', function () {

          });
        }
      }, null);

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

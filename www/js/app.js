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
        }, function(){

        });
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

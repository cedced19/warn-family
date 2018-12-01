var permissionsToRemove = [ 'RECEIVE_MMS', 'READ_SMS', 'RECEIVE_SMS', 'READ_SMS', 'RECEIVE_WAP_PUSH'];

var fs = require('fs');
var path = require('path');
var rootdir = '';
var manifestFile = path.join(rootdir, 'platforms/android/AndroidManifest.xml');

fs.readFile( manifestFile, 'utf8', function( err, data )
{
    if (err)
        return console.log( err );

    var result = data;
    for (var i=0; i<permissionsToRemove.length; i++)
        result = result.replace( '<uses-permission android:name="android.permission.' + permissionsToRemove[i] + '" />', '' );

    fs.writeFile( manifestFile, result, 'utf8', function( err )
    {
        if (err)
            return console.log( err );
    } );
} );

var bg = chrome.extension.getBackgroundPage();

// Log console messages to the background page console instead of the content page.
var console = bg.console;
var auth = bg.auth;

/* -------------------- -------------------------- -------------------- */
var html_usernameLoginFld = $('#usernameLoginFld');
var html_passwordLoginFld = $('#passwordLoginFld');
var html_submitButton = $('#submitBtn');

var html_signinButton = $('#signinBtn');
var html_usernameSigninFld = $('#usernameSigninFld');
var html_passwordSigninFld = $('#passwordSigninFld');
var html_emailSigninFld = $('#emailSigninFld');

var html_signinAnonButton = $('#signinAnonBtn');
var html_usernameSigninAnonFld = $('#usernameSigninAnonFld');
var html_passwordSigninAnonFld = $('#passwordSigninAnonFld');

var messageDialog = $('#message');
var spinner = $('#spinner');

login = function(){
    var username = html_usernameLoginFld.val();
    var password = html_passwordLoginFld.val();

    console.log("Username:" + username + " Password:" + password);
    auth.loginAnon(username, password).then(function(){
        spinner.show();
    }).then(function(response){
        setTimeout(function(){
            messageDialog.text("You logged in! "+response);
        }, 2000);
    }, function(error){
        setTimeout(function(){
            messageDialog.text("Wrong credentials..");
        }, 2000);
    }).then(function(){
        //spinner.hide();
    });

    html_usernameLoginFld.val('');
    html_passwordLoginFld.val('');
};

signinAnon = function(){
    var username = html_usernameSigninAnonFld.val();
    var password = html_passwordSigninAnonFld.val();

    console.log("Username:" + username + " Password:" + password);
    auth.signinAnon(username, password);

    html_usernameSigninAnonFld.val('');
    html_passwordSigninAnonFld.val('');
};

signin = function(){
    var username = html_usernameSigninFld.val();
    var password = html_passwordSigninFld.val();
    var email = html_emailSigninFld.val();

    console.log("Username:" + username + " Password:" + password + " Email:" + email);
    auth.signin(username, password, email);

    //html_usernameSigninFld.val('');
    //html_passwordSigninFld.val('');
};


//Connect functions to HTML elements
connectButton = function(html_button, method) {
    html_button.on('click', method);
};

connectHtmlFunctionality = function() {
    connectButton(html_submitButton, login);
};

//Run this when the page is loaded.
document.addEventListener("DOMContentLoaded", function(){
    connectHtmlFunctionality();
});

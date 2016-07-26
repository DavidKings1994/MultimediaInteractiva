define(['jquery','Backbone'], function($, Backbone) {
    var gameOverScreen = Backbone.View.extend({
        tagname: "div",
        className: "gameOverScreen",
        initialize: function() {
            Backbone.on("gameOver", this.showScreen, true);
            Backbone.on("restart", this.hideScreen, true);

            window.fbAsyncInit = function() {
                FB.init({
                    appId      : '1652597161732445',
                    cookie     : true,
                    xfbml      : true,
                    version    : 'v2.2'
                });

                FB.getLoginStatus(function(response) {
                    statusChangeCallback(response);
                });

            };

            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        },
        checkLoginState: function() {
            FB.getLoginStatus(function(response) {
                this.statusChangeCallback(response);
            });
        },
        testAPI: function() {
            console.log('Welcome!  Fetching your information.... ');
            FB.api('/me', function(response) {
                console.log(response);
                document.getElementById('status').innerHTML =
                'Thanks for logging in, ' + response.name + '!';
            });
        },
        statusChangeCallback: function(response) {
            console.log('statusChangeCallback');
            console.log(response);
            if (response.status === 'connected') {
                this.testAPI();
            } else if (response.status === 'not_authorized') {
                document.getElementById('status').innerHTML = 'Please log ' +
                'into this app.';
            } else {
                document.getElementById('status').innerHTML = 'Please log ' +
                'into Facebook.';
            }
        },
        showScreen: function() {
            $(".gameOverScreen").css("display", "block");
            console.log("gameOver");
        },
        hideScreen: function() {
            $(".gameOverScreen").css("display", "none");
            console.log("restart");
        },
        render: function() {
            this.button = $("<input />", {
                type: "button",
                id: "restartButton",
                value: "try again!"
            });
            var message = $("<p />", {
                class: "message",
                text: "Game Over"
            });
            var messageContainer = $("<div />", {
                class: "messageContainer"
            });
            var likeButton = $("<div />", {
                class: "fb-like",
                css: {
                    "display": "block"
                }
            });
            $(likeButton).attr("data-layout","button_count");
            $(likeButton).attr("data-href","www.multimediainteractiva.ga");
            $(likeButton).attr("data-share","true");
            $(likeButton).attr("data-width","450");
            $(likeButton).attr("data-show-faces","true");
            var loginButton = $("<fb:login-button />", {});
            $(loginButton).on("login", this.checkLoginState);
            $(loginButton).attr("scope", "public_profile,email");
            messageContainer.append(message);
            messageContainer.append(this.button);
            messageContainer.append(likeButton);
            messageContainer.append(loginButton);
            this.$el.append(messageContainer);
        }
    });
    return gameOverScreen;
})

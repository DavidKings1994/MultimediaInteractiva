define(['jquery','Backbone'], function($, Backbone) {
    var gameOverScreen = Backbone.View.extend({
        tagname: "div",
        className: "gameOverScreen",
        initialize: function() {
            Backbone.on("gameOver", this.showScreen, true);
            Backbone.on("restart", this.hideScreen, true);
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
            messageContainer.append(message);
            messageContainer.append(this.button);
            this.$el.append(messageContainer);
        }
    });
    return gameOverScreen;
})

define(['jquery','Backbone'], function($, Backbone) {
    var leaderBoardRow = Backbone.View.extend({
        tagname: "div",
        className: "leaderBoardRow",
        initialize: function(parameters) {
            this.url = parameters.url;
            this.name = parameters.name;
            this.score = parameters.score;
        },
        render: function() {
            var picture = $("<img />", {
                class: "image",
                src: this.url
            });
            var name = $("<p />", {
                class: "text",
                text: this.name
            });
            var score = $("<p />", {
                class: "text",
                text: this.score
            });
            this.$el.append(picture);
            this.$el.append(name);
            this.$el.append(score);
        }
    });
    return leaderBoardRow;
})

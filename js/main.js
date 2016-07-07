define(['jquery',"three", "./game/KingsGame"],  function($, THREE, KingsGame) {
	$(document).ready(function() {
		$("#gameContainer").initGame();
    });
});

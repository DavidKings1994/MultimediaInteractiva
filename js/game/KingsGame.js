(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery','three'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery','three'));
    } else {
        root.myModule = factory(root.jquery, root.three);
    }
}(this, function($, THREE) {
    'use strict';
    var KingsGame = window.KingsGame || {};

    var KingsGame = ( function() {
        function KingsGame() {
            var _ = this, dataSettings;
            _.init(true);
        }
        return KingsGame;
    }());

    KingsGame.prototype.render = function () {
        requestAnimationFrame( KingsGame.prototype.render );

        var cube = KingsGame.scene.getObjectByName( "cube" );
        cube.rotation.x += 0.1;
        cube.rotation.y += 0.1;

        KingsGame.renderer.render(KingsGame.scene, KingsGame.camera);
    };

    KingsGame.prototype.onWindowResize = function() {
        KingsGame.camera.aspect = window.innerWidth / window.innerHeight;
        KingsGame.camera.updateProjectionMatrix();
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    $.fn.initGame = function() {
        KingsGame.scene = new THREE.Scene();
        KingsGame.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

        KingsGame.renderer = new THREE.WebGLRenderer();
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
        $(this).append( KingsGame.renderer.domElement );

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh( geometry, material );
        cube.name = "cube";
        KingsGame.scene.add( cube );

        KingsGame.camera.position.z = 5;

        window.addEventListener( 'resize', KingsGame.prototype.onWindowResize, false );

        KingsGame.prototype.render();
    };
}));

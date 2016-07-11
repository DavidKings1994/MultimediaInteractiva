(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery','three','underscore','cannon'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery','three','underscore','cannon'));
    } else {
        root.myModule = factory(root.jquery, root.three, root.underscore, root.cannon);
    }
}(this, function($, THREE, _, CANNON) {
    'use strict';
    var KingsGame = window.KingsGame || {};

    var KingsGame = ( function() {
        function KingsGame() {
            var self = this, dataSettings;
            self.init(true);
        }
        return KingsGame;
    }());

    KingsGame.GameObject = function(position, weight) {
        var shape = new CANNON.Box( new CANNON.Vec3(0.5,0.5,0.5) );
        this.body = new CANNON.Body({
            mass: weight,
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        this.body.addShape(shape);
        this.body.angularVelocity.set(0,3,0);
        this.body.angularDamping = 0.5;
        KingsGame.world.addBody( this.body );

        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
        this.mesh = new THREE.Mesh( geometry, material );
        this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
        this.mesh.position.copy( this.mesh.position );
        this.mesh.quaternion.copy( this.mesh.quaternion );
        KingsGame.scene.add( this.mesh );
    };

    KingsGame.GameObject.prototype = {
        constructor: KingsGame.GameObject,

        update: function() {
            this.mesh.position.copy( this.body.position );
            this.mesh.quaternion.copy( this.body.quaternion );
        }
    };

    KingsGame.prototype.updatePhysics = function () {
        KingsGame.world.step( KingsGame.timeStep );
        var elements = _.toArray(KingsGame.gameobjects);
        for (var i = 0; i < elements.length; i++) {
            elements[i].update();
        }
    };

    KingsGame.prototype.update = function () {
        KingsGame.prototype.updatePhysics();
    };

    KingsGame.prototype.render = function () {
        requestAnimationFrame( KingsGame.prototype.render );
        if(!KingsGame.paused) {
            KingsGame.prototype.update();
        }
        KingsGame.renderer.clear();
        KingsGame.renderer.render(KingsGame.scene, KingsGame.camera);
    };

    KingsGame.prototype.lockPointer = function() {
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if ( havePointerLock ) {
            var element = document.body;
            var pointerlockchange = function ( event ) {
                if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                    //controlsEnabled = true;
                    //controls.enabled = true;
                    blocker.style.display = 'none';
                    scoreContainer.style.display = "box";
                    scoreContainer.style.display = '-webkit-box';
                    scoreContainer.style.display = '-moz-box';
                    KingsGame.paused = false;
                } else {
                    //controls.enabled = false;
                    blocker.style.display = '-webkit-box';
                    blocker.style.display = '-moz-box';
                    blocker.style.display = 'box';
                    instructions.style.display = '';
                    scoreContainer.style.display = "none";
                    KingsGame.paused = true;
                }
            };
            var pointerlockerror = function ( event ) {
                instructions.style.display = '';
            };
            // Hook pointer lock state change events
            document.addEventListener( 'pointerlockchange', pointerlockchange, false );
            document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
            document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
            document.addEventListener( 'pointerlockerror', pointerlockerror, false );
            document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
            document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
            instructions.addEventListener( 'click', function ( event ) {
                scoreContainer.style.display = "box";
                instructions.style.display = 'none';
                // Ask the browser to lock the pointer
                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                if ( /Firefox/i.test( navigator.userAgent ) ) {
                    var fullscreenchange = function ( event ) {
                        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                            document.removeEventListener( 'fullscreenchange', fullscreenchange );
                            document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                            element.requestPointerLock();
                        }
                    };
                    document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                    document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                    element.requestFullscreen();
                } else {
                    element.requestPointerLock();
                }
            }, false );
        } else {
            instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
        }
    };

    KingsGame.prototype.onWindowResize = function() {
        KingsGame.camera.aspect = window.innerWidth / window.innerHeight;
        KingsGame.camera.updateProjectionMatrix();
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    KingsGame.prototype.onMouseMove = function( event ) {

    }

    KingsGame.prototype.onKeyDown = function( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
            break;
            case 37: // left
            case 65: // a
            break;
            case 40: // down
            case 83: // s
            break;
            case 39: // right
            case 68: // d
            break;
            case 32: // space
            break;
            case 49: // h
            break;
            case 50: // d
            break;
        }
    };

    KingsGame.prototype.onKeyUp = function( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
            break;
            case 37: // left
            case 65: // a
            break;
            case 40: // down
            case 83: // s
            break;
            case 39: // right
            case 68: // d
            break;
            case 32: // space
            break;
            case 49: // h
            break;
            case 50: // d
            break;
        }
    };

    $.fn.initGame = function( pointerLocked ) {
        KingsGame.timeStep = 1.0 / 60.0;
        KingsGame.paused = true;

        KingsGame.world = new CANNON.World();
        KingsGame.world.gravity.set(0,0,-9.82);
        KingsGame.world.broadphase = new CANNON.NaiveBroadphase();
        KingsGame.world.solver.iterations = 10;

        KingsGame.scene = new THREE.Scene();
        KingsGame.scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
		KingsGame.scene.fog.color.setHSL( 0.6, 0, 1 );
		var ambient = new THREE.AmbientLight( 0x444444 );
		KingsGame.scene.add( ambient );

		var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		hemiLight.color.setHSL( 0.6, 1, 0.6 );
		hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
		hemiLight.position.set( 0, 0, 500 );
		KingsGame.scene.add( hemiLight );

        var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
		dirLight.color.setHSL( 0.1, 1, 0.95 );
		dirLight.position.set( -10, 10, 10 );
		dirLight.position.multiplyScalar( 50 );
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		var d = 5;
		dirLight.shadow.camera.left = -d;
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d;
		dirLight.shadow.camera.bottom = -d;
		dirLight.shadow.camera.far = 3500;
		dirLight.shadow.bias = -0.0001;
		KingsGame.scene.add( dirLight );

		var vertexShader = document.getElementById( 'vertexShader' ).textContent;
		var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
		var uniforms = {
			topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
			bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
			offset:		 { type: "f", value: 33 },
			exponent:	 { type: "f", value: 0.6 }
		};
		uniforms.topColor.value.copy( hemiLight.color );
		KingsGame.scene.fog.color.copy( uniforms.bottomColor.value );

		var skyGeo = new THREE.SphereGeometry( 400, 32, 15 );
		var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
		var sky = new THREE.Mesh( skyGeo, skyMat );
		KingsGame.scene.add( sky );

        KingsGame.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

        KingsGame.renderer = new THREE.WebGLRenderer( { antialias: true } );
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
        KingsGame.renderer.setPixelRatio( window.devicePixelRatio );
        KingsGame.renderer.shadowMap.enabled = true;
        KingsGame.renderer.shadowMapSoft = true;
        KingsGame.renderer.shadowCameraNear = 3;
        KingsGame.renderer.shadowCameraFar = KingsGame.camera.far;
        KingsGame.renderer.shadowCameraFov = 50;
        KingsGame.renderer.shadowMapBias = 0.0039;
        KingsGame.renderer.shadowMapDarkness = 0.5;
        KingsGame.renderer.shadowMapWidth = 1024;
        KingsGame.renderer.shadowMapHeight = 1024;
		KingsGame.renderer.shadowMap.type = THREE.PCFShadowMap;
        KingsGame.renderer.autoClear = false;
        $(this).append( KingsGame.renderer.domElement );

        KingsGame.gameobjects = {
            "cube1" : new KingsGame.GameObject(new THREE.Vector3(0,0,4), 2),
            "cube2" : new KingsGame.GameObject(new THREE.Vector3(0,0,1), 1)
        };

        var groundBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0,0,-2)
        });
        var groundShape = new CANNON.Plane();
        groundBody.addShape( groundShape );
        KingsGame.world.addBody( groundBody );

        var geometry = new THREE.PlaneGeometry( 100, 100 );
        var material = new THREE.MeshPhongMaterial( { color: 0xffdd99 } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.copy( groundBody.position );
        mesh.quaternion.copy( groundBody.quaternion );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        KingsGame.scene.add( mesh );

        KingsGame.camera.position.set(0,5,0);
        KingsGame.camera.up = new THREE.Vector3(0,0,1);
        KingsGame.camera.lookAt(new THREE.Vector3(0,0,0));

        window.addEventListener( 'resize', KingsGame.prototype.onWindowResize, false );
        document.addEventListener( 'keydown', KingsGame.prototype.onKeyDown, false );
        document.addEventListener( 'keyup', KingsGame.prototype.onKeyUp, false );
        document.addEventListener( 'mousemove', KingsGame.prototype.onMouseMove, false );
        if( pointerLocked ) {
            KingsGame.prototype.lockPointer();
        }

        KingsGame.prototype.render();
    };
}));

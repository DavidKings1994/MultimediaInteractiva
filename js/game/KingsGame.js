(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery','three','underscore','cannon','Backbone'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery','three','underscore','cannon','Backbone'));
    } else {
        root.myModule = factory(root.jquery, root.three, root.underscore, root.cannon, root.Backbone);
    }
}(this, function($, THREE, _, CANNON, Backbone) {
    'use strict';

    var KingsGame = window.KingsGame || {};
    window.THREE = THREE;

    require('./../../node_modules/three/examples/js/loaders/OBJLoader.js');
    require('./../../node_modules/three/examples/js/loaders/MTLLoader.js');
    require('./../../node_modules/three/examples/js/utils/GeometryUtils.js');
    require('./../../node_modules/three/examples/js/Detector.js');
    var LoadingScreen = require( __dirname + '/../views/loadingScreen.js');
    var Stats = require('./../../node_modules/three/examples/js/libs/stats.min.js');

    var KingsGame = ( function() {
        function KingsGame() {
            var self = this, dataSettings;
            self.init(true);
        }
        return KingsGame;
    }());

    KingsGame.GameObject = function(parameters) {
        this.rotation = parameters.rotation || new THREE.Vector3(0,0,0);
        this.scale = parameters.scale || new THREE.Vector3(1,1,1);
        this.position = parameters.position || new THREE.Vector3(0,0,0);
        this.direction = parameters.direction || new THREE.Vector3(0,-5,0);
        this.soundPath = parameters.soundPath || "";
        this.bounciness = parameters.bounciness || 0;

        if(parameters.useMTL) {
            this.loadObjMtl( parameters.modelPath, parameters.fileName );
        } else {
            this.loadObj( parameters.modelPath, parameters.fileName );
        }

        var mat = new CANNON.Material();
        var shape = new CANNON.Box( new CANNON.Vec3(1,1,1) );
        this.body = new CANNON.Body({
            mass: parameters.weight,
            material: mat,
            position: new CANNON.Vec3(
                parameters.position.x,
                parameters.position.y,
                parameters.position.z
            )
        });
        if(parameters.colideEvent != null) {
            this.body.addEventListener("collide",parameters.colideEvent);
        }
        if(this.bounciness > 0) {
            var mat_ground = new CANNON.ContactMaterial(KingsGame.groundMaterial, mat, { friction: 0.3, restitution: this.bounciness });
            KingsGame.world.addContactMaterial(mat_ground);
        }
        this.body.addShape(shape);
        KingsGame.world.addBody( this.body );
    };

    KingsGame.GameObject.prototype = {
        constructor: KingsGame.GameObject,

        update: function() {
            this.position.copy( this.body.position );
            this.model.position.copy( this.body.position );
            this.model.quaternion.copy( this.body.quaternion );
            this.model.rotateX(this.rotation.x * (Math.PI / 180));
            this.model.rotateY(this.rotation.y * (Math.PI / 180));
            this.model.rotateZ(this.rotation.z * (Math.PI / 180));
            this.model.scale.x = this.scale.x;
            this.model.scale.y = this.scale.y;
            this.model.scale.z = this.scale.z;
            if(this.soundAnalyser != null) {
                this.model.children[0].material.emissive.b = this.soundAnalyser.getAverageFrequency() / 256;
            }
        },

        initModel(object) {
            this.model = object;
            this.model.castShadow = true;
            this.model.receiveShadow = true;
            if(this.soundPath != "") {
                this.bindSound(this.soundPath);
            }
            KingsGame.scene.add( this.model );
            this.update();
        },

        loadObj: function(path, file) {
            var self = this;
            var objLoader = new THREE.OBJLoader(KingsGame.manager);
            objLoader.setPath( path );
            objLoader.load( file+'.obj', function ( object ) {
                object.name = file;
                object.traverse( function (child) {
                    if ( child instanceof THREE.Mesh ) {
                        var textureLoader = new THREE.TextureLoader(KingsGame.manager);
                        textureLoader.load( path+file+'.jpg',
                        	function ( texture ) {
                        		child.material = new THREE.MeshPhongMaterial({
                        			map: texture
                        		});
                        	}
                        );
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                self.initModel(object);
            });
        },

        loadObjMtl: function(path, file) {
            var self = this;
            var mtlLoader = new THREE.MTLLoader(KingsGame.manager);
			mtlLoader.setPath( path );
			mtlLoader.load( file+'.mtl', function( materials ) {
				materials.preload();
                var objLoader = new THREE.OBJLoader(KingsGame.manager);
                objLoader.setPath( path );
                objLoader.setMaterials( materials );
                objLoader.load( file+'.obj', function ( object ) {
                    object.name = file;
                    object.traverse( function (child) {
                        if ( child instanceof THREE.Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    self.initModel(object);
                });
            },this.onProgress);
        },

        bindSound: function(soundPath) {
            var audioLoader = new THREE.AudioLoader( KingsGame.manager );
            var sound = new THREE.PositionalAudio( KingsGame.listener );
    		audioLoader.load( soundPath, function( buffer ) {
    			sound.setBuffer( buffer );
    			sound.setRefDistance( 20 );
    			sound.play();
    		});
    		this.model.add( sound );
            this.soundAnalyser = new THREE.AudioAnalyser( sound, 32 );
        },
    };

    KingsGame.Player = function(parameters) {
        KingsGame.GameObject.apply(this, arguments);

        this.STATES = {
            "iddle" : 0,
            "turningRight" : 1,
            "turningLeft" : 2,
        };
        this.state = this.STATES.iddle;
        this.mass = parameters.weight || 1;
        this.maxSteerVal = Math.PI / 8;
        this.maxSpeed = 5;
        this.maxForce = 50;
        this.turning = 0;

        var chassisShape;
        var centerOfMassAdjust = new CANNON.Vec3(0, 0, 1);
        chassisShape = new CANNON.Box(new CANNON.Vec3(1, 4, 1));
        var chassisBody = new CANNON.Body({ mass: 20 });
        chassisBody.addShape(chassisShape, centerOfMassAdjust);
        chassisBody.position.set(this.position.x, this.position.y, this.position.z);
        chassisBody.position.vadd(centerOfMassAdjust);
        KingsGame.world.removeBody(this.body);
        this.body = chassisBody;
        this.body.name = "player";

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: chassisBody
        });

        var axisWidth = 4;
        var wheelShape = new CANNON.Sphere(0.5);
        var down = new CANNON.Vec3(0, 0, -1);
        var wheelMaterial = new CANNON.Material("wheelMaterial");

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(axisWidth/2, -4, 0),
            axis: new CANNON.Vec3(1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(-axisWidth/2, -4, 0),
            axis: new CANNON.Vec3(-1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(axisWidth/2, 4, 0),
            axis: new CANNON.Vec3(1, 0, 0),
            direction: down
        });

        var wheelBody = new CANNON.Body({ mass: this.mass, material: wheelMaterial });
        wheelBody.addShape(wheelShape);
        this.vehicle.addWheel({
            body: wheelBody,
            position: new CANNON.Vec3(-axisWidth/2, 4, 0),
            axis: new CANNON.Vec3(-1, 0, 0),
            direction: down
        });

        if(parameters.colideEvent != null) {
            this.body.addEventListener("collide",parameters.colideEvent);
        }
        for(var i=0; i<this.vehicle.wheelBodies.length; i++){
            this.vehicle.wheelBodies[i].angularDamping = 0.4;
            this.vehicle.wheelBodies[i].name = "wheel";
            if(parameters.colideEvent != null) {
                this.vehicle.wheelBodies[i].addEventListener("collide",parameters.colideEvent);
            }
        }

        this.vehicle.addToWorld(KingsGame.world);
    };

    KingsGame.Player.prototype = Object.create(KingsGame.GameObject.prototype);

    KingsGame.Player.prototype.constructor = KingsGame.Player;

    KingsGame.Player.prototype.update = function() {
        KingsGame.GameObject.prototype.update.call(this);
        for (var i = 0; i < this.model.children.length; i++) {
            if(
                this.model.children[i].name == "Car_Con_Box_Cube.014" ||
                this.model.children[i].name == "Front_Wheel_Force_1_L_Front_Wheel_Force" ||
                this.model.children[i].name == "Front_Wheel_Force_1_R_Front_Wheel_Force.001" ||
                this.model.children[i].name == "Back_Wheel_Force_1_R_Back_Wheel_Force.001" ||
                this.model.children[i].name == "Back_Wheel_Force_1_L_Back_Wheel_Force"
            ){
                this.model.children[i].visible = false;
            }
            if(this.model.children[i].name == "Front_Steering_Mesh_2_R_Cube.004") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(1.3,0.6,-2.55);
                this.model.children[i].geometry.rotateX(-this.vehicle.getWheelSpeed(0)*(Math.PI/180));
                this.model.children[i].rotation.set(this.vehicle.getWheelSpeed(0)*(Math.PI/180),0,0);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Wheel_Mesh_1_R_Cube.005") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(1.3,0.6,-2.65);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Wheel_Mesh_2_L_Cube.009") { //front left wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(-1.3,0.6,-2.55);
                this.model.children[i].geometry.rotateX(this.vehicle.getWheelSpeed(1)*(Math.PI/180));
                this.model.children[i].rotation.set(-this.vehicle.getWheelSpeed(1)*(Math.PI/180),0,0);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Front_Steering_Mesh_1_L_Cube.010") { //front right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].position.set(-1.3,0.6,-2.65);
                this.model.children[i].rotateOnAxis(new THREE.Vector3(0,1,0),-this.turning*(Math.PI/180));
                this.model.children[i].rotation.set(0,-this.turning*(Math.PI/180),0);
            }
            if(this.model.children[i].name == "Back_Wheel_Mesh_1_L_Cube.002") { //back right wheel
                this.model.children[i].geometry.center();
                this.model.children[i].geometry.translate(-1.6,0.6,2.2);
                this.model.children[i].geometry.rotateX(-this.vehicle.getWheelSpeed(2)*(Math.PI/180));
                this.model.children[i].rotation.set(this.vehicle.getWheelSpeed(2)*(Math.PI/180),0,0);
            }
            if(this.model.children[i].name == "Back_Wheel_Mesh_1_R_Cube.003") { //back left wheel
                this.model.children[i].geometry.center();
                this.model.children[i].geometry.translate(1.6,0.6,2.2);
                this.model.children[i].geometry.rotateX(this.vehicle.getWheelSpeed(3)*(Math.PI/180));
                this.model.children[i].rotation.set(-this.vehicle.getWheelSpeed(3)*(Math.PI/180),0,0);
            }
        }
        switch (this.state) {
        case this.STATES.iddle:
            if(this.turning < 0) {
                this.turning+=5;
            }
            if(this.turning > 0) {
                this.turning-=5;
            }
            break;
        case this.STATES.turningRight:
            if(this.turning < 35) {
                this.turning+=5;
            }
            break;
        case this.STATES.turningLeft:
            if(this.turning > -35) {
                this.turning-=5;
            }
            break;
        }
    };

    KingsGame.Player.prototype.getDirection = function() {
        var temp = new THREE.Vector3();
        temp.copy(this.direction);
        temp.applyQuaternion(this.body.quaternion);
        return temp;
    };

    KingsGame.RoadSection = function(parameters) {
        this.id = parameters.id;
        this.position = parameters.position || new CANNON.Vec3();
        this.size = parameters.size || new CANNON.Vec3(50,50,0.05);
        this.HAZARDS = {
            "plain": 0
        };
        this.hazard = parameters.hazard || this.HAZARDS.plain;
        this.DIFICULTY = {
            "easy": 0,
            "medium": 0,
            "hard": 0
        };
        this.dificulty = parameters.dificulty || this.DIFICULTY.easy;

        this.groundBody = new CANNON.Body({
            mass: 0,
            position: this.position,
            material: KingsGame.groundMaterial
        });
        var groundShape = new CANNON.Box( this.size );
        this.groundBody.addShape( groundShape );
        KingsGame.world.addBody( this.groundBody );

        var bmap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_b.png" );
        bmap.wrapS = bmap.wrapT = THREE.RepeatWrapping;
        bmap.repeat.set( 10, 10 );
        var smap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_d.jpg" );
        smap.wrapS = smap.wrapT = THREE.RepeatWrapping;
        smap.repeat.set( 10, 10 );
        var groundTexture = new THREE.MeshPhongMaterial({
            shininess  :  0,
            bumpMap    :  bmap,
            map        :  smap,
            bumpScale  :  0.45,
        });
        var geometry = new THREE.PlaneGeometry( this.size.x * 2, this.size.y * 2 );
        this.mesh = new THREE.Mesh( geometry, groundTexture );
        this.mesh.position.copy( this.groundBody.position );
        this.mesh.quaternion.copy( this.groundBody.quaternion );
        this.mesh.receiveShadow = true;
        KingsGame.scene.add( this.mesh );
    };

    KingsGame.RoadSection.prototype = {
        constructor: KingsGame.RoadSection,

        update: function() {

        },
    };

    KingsGame.Road = function() {
        this.road = [];
        for (var i = 0; i < 4; i++) {
            this.road.push(new KingsGame.RoadSection({
                id: i,
                position: new CANNON.Vec3( 0, i * -100, -10 )
            }));
        }
    };

    KingsGame.Road.prototype = {
        constructor: KingsGame.Road,

        update: function() {
            var index = this.locatePlayer();
            if(index > this.road.length - 3) {
                console.log(this.road);
                this.road.push(new KingsGame.RoadSection({
                    id: this.road[3].id + 1,
                    position: new CANNON.Vec3( 0, (this.road[3].id + 1) * -100, -10 )
                }));
                KingsGame.scene.remove( this.road[0].mesh );
                KingsGame.world.removeBody ( this.road[0].groundBody );
                this.road.splice(0,1);
                console.log(this.road);
            }
            for (var i = 0; i < this.road.length; i++) {
                this.road[i].update();
            }
        },

        locatePlayer: function() {
            for (var i = 0; i < this.road.length; i++) {
                if(
                    (
                        KingsGame.gameobjects.player.position.x > (this.road[i].position.x - this.road[i].size.x) &&
                        KingsGame.gameobjects.player.position.x < (this.road[i].position.x + this.road[i].size.x)
                    ) && (
                        KingsGame.gameobjects.player.position.y > (this.road[i].position.y - this.road[i].size.y) &&
                        KingsGame.gameobjects.player.position.y < (this.road[i].position.y + this.road[i].size.y)
                    )
                ) {
                    return i;
                }
            }
        },

        insideRoad(position) {
            if((position.x > -50 && position.x < 50) && (position.z > -15)) {
                return true;
            }
            return false;
        },
    };

    KingsGame.prototype.updatePhysics = function () {
        KingsGame.world.step( KingsGame.timeStep );
    };

    KingsGame.prototype.update = function () {
        KingsGame.stats.update();
        KingsGame.prototype.updatePhysics();
        var elements = _.toArray(KingsGame.gameobjects);
        for (var i = 0; i < elements.length; i++) {
            elements[i].update();
        }
        if( KingsGame.road.insideRoad(KingsGame.gameobjects.player.position) ) {
            KingsGame.road.update();
            KingsGame.sky.position.set(
                KingsGame.gameobjects.player.position.x,
                KingsGame.gameobjects.player.position.y,
                0
            );
            switch (KingsGame.camera.type) {
                case KingsGame.CAMERA_TYPES.firstPerson: {
                    var fixedVec = new THREE.Vector3(0,-1.5,1.5);
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    fixedVec.add(KingsGame.gameobjects.player.position);
                    KingsGame.camera.position.set( fixedVec.x, fixedVec.y, fixedVec.z );
                    fixedVec.add(KingsGame.gameobjects.player.getDirection());
                    KingsGame.camera.lookAt(fixedVec);
                    var up = new THREE.Vector3(0,1,0);
                    up.applyQuaternion(KingsGame.gameobjects.player.model.quaternion);
                    KingsGame.camera.up.copy(up);
                    break;
                }
                case KingsGame.CAMERA_TYPES.thirdPerson: {
                    var fixedVec = new THREE.Vector3(0,0,3);
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    fixedVec.add(KingsGame.gameobjects.player.position);
                    fixedVec.add(KingsGame.gameobjects.player.getDirection().negate());
                    KingsGame.camera.position.set( fixedVec.x, fixedVec.y, fixedVec.z );
                    KingsGame.camera.lookAt(KingsGame.gameobjects.player.position);
                    KingsGame.camera.up.set(0,0,1);
                    break;
                }
                case KingsGame.CAMERA_TYPES.upView: {
                    var fixedVec = KingsGame.gameobjects.player.position.clone();
                    fixedVec.applyQuaternion(KingsGame.gameobjects.player.body.quaternion);
                    KingsGame.camera.position.set(
                        KingsGame.gameobjects.player.position.x,
                        KingsGame.gameobjects.player.position.y,
                        KingsGame.gameobjects.player.position.z + 30
                    );
                    KingsGame.camera.lookAt(KingsGame.gameobjects.player.position);
                    KingsGame.camera.up.set(0,0,1);
                    break;
                }
            }
        } else {
            KingsGame.gameOver = true;
            KingsGame.camera.lookAt(KingsGame.gameobjects.player.position);
        }
        KingsGame.dirLight.position.set(
            KingsGame.gameobjects.player.position.x,
            KingsGame.gameobjects.player.position.y - 5,
            KingsGame.gameobjects.player.position.z + 20
        );
        KingsGame.dirLight.target.position.copy(KingsGame.gameobjects.player.position);
        KingsGame.dirLight.shadow.camera.updateProjectionMatrix();
    };

    KingsGame.prototype.render = function () {
        requestAnimationFrame( KingsGame.prototype.render );
        if(!KingsGame.paused) {
            KingsGame.prototype.update();
        }
        KingsGame.renderer.clear();
        if(KingsGame.ready) {
            Backbone.trigger( 'done' );
        }
        KingsGame.renderer.render(KingsGame.scene, KingsGame.camera);
    };

    KingsGame.prototype.lockPointer = function() {
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
        if ( havePointerLock ) {
            var element = document.body;
            var pointerlockchange = function ( event ) {
                if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                    blocker.style.display = 'none';
                    scoreContainer.style.display = "box";
                    scoreContainer.style.display = '-webkit-box';
                    scoreContainer.style.display = '-moz-box';
                    KingsGame.paused = false;
                } else {
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
        //
    }

    KingsGame.prototype.keyHandler = function(event) {
        var up = (event.type == 'keyup');

        if(!up && event.type !== 'keydown')
            return;

        switch(event.keyCode){

        case 87: // w
        case 38: // forward
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : KingsGame.gameobjects.player.maxForce, 2);
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : -KingsGame.gameobjects.player.maxForce, 3);
            break;
        case 83: // s
        case 40: // backward
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : -KingsGame.gameobjects.player.maxForce/2, 2);
            KingsGame.gameobjects.player.vehicle.setWheelForce(up ? 0 : KingsGame.gameobjects.player.maxForce/2, 3);
            break;
        case 65: // a
        case 37: // left
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : KingsGame.gameobjects.player.maxSteerVal, 0);
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : KingsGame.gameobjects.player.maxSteerVal, 1);
            break;
        case 68: // d
        case 39: // right
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : -KingsGame.gameobjects.player.maxSteerVal, 0);
            KingsGame.gameobjects.player.vehicle.setSteeringValue(up ? 0 : -KingsGame.gameobjects.player.maxSteerVal, 1);
            break;
        }
    };

    KingsGame.prototype.onKeyDown = function( event ) {
        KingsGame.prototype.keyHandler( event );
        switch(event.keyCode){

        case 49: // first person: 1
            var elements = _.toArray(KingsGame.CAMERA_TYPES);
            if (KingsGame.camera.type < elements.length - 1 ) {
                KingsGame.camera.type++;
            } else {
                KingsGame.camera.type = 0;
            }
            console.log(KingsGame.camera.type);
            break;

        case 50: // third person: 2
            break;

        case 39: // right
        case 68: // d
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.turningRight;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,1);
            break;

        case 37: // left
        case 65: // a
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.turningLeft;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,-1);
            break;
        }
    };

    KingsGame.prototype.onKeyUp = function( event ) {
        KingsGame.prototype.keyHandler( event );
        switch(event.keyCode){
        case 39: // right
        case 37: // left
        case 68: // d
        case 65: // a
            KingsGame.gameobjects.player.state = KingsGame.gameobjects.player.STATES.iddle;
            //KingsGame.gameobjects.player.body.angularVelocity.set(0,0,0);
            break;
        }
    };

    KingsGame.prototype.bindSoundToMesh = function(mesh, soundPath) {
        var audioLoader = new THREE.AudioLoader();
        var sound = new THREE.PositionalAudio( KingsGame.listener );
		audioLoader.load( soundPath, function( buffer ) {
			sound2.setBuffer( buffer );
			sound2.setRefDistance( 20 );
			sound2.play();
		});
		mesh.add( sound );
    };

    KingsGame.prototype.initLoadManager = function() {
        KingsGame.manager = new THREE.LoadingManager();
        KingsGame.manager.onProgress = function(item, loaded, total) {
            var percentComplete = loaded / total * 100;
            percentComplete = Math.round(percentComplete, 2)
            Backbone.trigger('loading', percentComplete);
        };
        KingsGame.manager.onLoad = function() {

        };
        KingsGame.manager.onError = function() {

        };
    }

    KingsGame.prototype.initGround = function() {
        THREE.crossOrigin = "";
        KingsGame.groundMaterial = new CANNON.Material("groundMaterial");
        var wheelMaterial = new CANNON.Material("wheelMaterial");
        var wheelGroundContactMaterial = window.wheelGroundContactMaterial = new CANNON.ContactMaterial(wheelMaterial, KingsGame.groundMaterial, {
            friction: 0.3,
            restitution: 0,
            contactEquationStiffness: 1000
        });
        KingsGame.world.addContactMaterial(wheelGroundContactMaterial);

        var bmap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_b.png" );
        bmap.wrapS = bmap.wrapT = THREE.RepeatWrapping;
        bmap.repeat.set( 10, 10 );
        var smap = new THREE.TextureLoader(KingsGame.manager).load( "./assets/textures/ground_d.jpg" );
        smap.wrapS = smap.wrapT = THREE.RepeatWrapping;
        smap.repeat.set( 10, 10 );
        var groundTexture = new THREE.MeshPhongMaterial({
            shininess  :  0,
            bumpMap    :  bmap,
            map        :  smap,
            bumpScale  :  0.45,
        });

        KingsGame.road = new KingsGame.Road();

        var mat = new CANNON.Material();
        var shape = new CANNON.Box( new CANNON.Vec3(4,10,0.1) );
        var body = new CANNON.Body({
            mass: 0,
            material: mat,
            position: new CANNON.Vec3(10,0,-7)
        });
        body.addShape( shape );
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), 20*(Math.PI/180));
        KingsGame.world.addBody( body );

        var mesh = new THREE.Mesh( new THREE.CubeGeometry( 8, 20, 0.2 ), groundTexture );
        mesh.position.copy( body.position );
        mesh.quaternion.copy( body.quaternion );
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        KingsGame.scene.add( mesh );
    };

    KingsGame.prototype.bumper = function(e){
        if(e.body.name == "player" || e.body.name == "wheel") {
            var dir = KingsGame.gameobjects.player.body.velocity.clone();
            dir.normalize();
            dir = dir.negate();
            dir.z = 0.3;
            dir = dir.scale(70);
            KingsGame.gameobjects.player.body.angularVelocity.set(0,0,0);
            KingsGame.gameobjects.player.body.inertia.set(0,0,0);
            KingsGame.gameobjects.player.body.velocity.copy(dir);
        }
    };

    KingsGame.prototype.initGameObjects = function() {
        KingsGame.gameobjects = {
            "player" : new KingsGame.Player({
                modelPath: './assets/models/car/',
                fileName: 'car',
                useMTL: true,
                position: new THREE.Vector3(0,0,0),
                rotation: new THREE.Vector3(90,180,0),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                colideEvent: function() {
                    KingsGame.ready = true;
                }
            }),
            "crate1" : new KingsGame.GameObject({
                modelPath: './assets/models/crate/',
                fileName: 'crate',
                useMTL: true,
                position: new THREE.Vector3(-1,-20,0),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                colideEvent: KingsGame.prototype.bumper
            }),
            "crate2" : new KingsGame.GameObject({
                modelPath: './assets/models/crate/',
                fileName: 'crate',
                useMTL: true,
                position: new THREE.Vector3(1,-20,0),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                colideEvent: KingsGame.prototype.bumper
            }),
            "crate3" : new KingsGame.GameObject({
                modelPath: './assets/models/crate/',
                fileName: 'crate',
                useMTL: true,
                position: new THREE.Vector3(0,-20,2),
                scale: new THREE.Vector3(1,1,1),
                weight: 4,
                bounciness: 0.9,
                //soundPath: './assets/sounds/running_hell.mp3'
                colideEvent: KingsGame.prototype.bumper
            }),
        };
    };

    $.fn.initGame = function( parameters ) {
        KingsGame.loadingScreen = new LoadingScreen();
        KingsGame.loadingScreen.render();
        $(document.body).append( KingsGame.loadingScreen.$el );

        KingsGame.ready = false;
        KingsGame.gameOver = false;
        KingsGame.timeStep = 1.0 / 60.0;
        KingsGame.paused = false;
        KingsGame.firstPerson = false;
        if( parameters.pointerLocked ) {
            KingsGame.prototype.lockPointer();
        }

        KingsGame.scene = new THREE.Scene();
        KingsGame.scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
        KingsGame.scene.fog.color.setHSL( 0.6, 0, 1 );
        var ambient = new THREE.AmbientLight( 0x444444 );
        KingsGame.scene.add( ambient );

        KingsGame.world = new CANNON.World();
        KingsGame.world.gravity.set(0,0,-9.82);
        KingsGame.world.broadphase = new CANNON.SAPBroadphase(KingsGame.world);
        KingsGame.world.solver.iterations = 10;
        KingsGame.world.defaultContactMaterial.friction = 0.2;

        KingsGame.prototype.initGround();
        KingsGame.prototype.initLoadManager();
        KingsGame.prototype.initGameObjects();

        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 0, 500 );
        KingsGame.scene.add( hemiLight );

        KingsGame.dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        KingsGame.dirLight.color.setHSL( 0.1, 1, 0.95 );
        KingsGame.dirLight.position.set( 0, -10, 10 );
        KingsGame.dirLight.target.position.set(0,0,0);
        KingsGame.scene.add( KingsGame.dirLight.target );
        KingsGame.dirLight.castShadow = true;
        KingsGame.dirLight.shadow.mapSize.width = 2048;
        KingsGame.dirLight.shadow.mapSize.height = 2048;
        var d = 20;
        KingsGame.dirLight.shadow.camera.left = -d;
        KingsGame.dirLight.shadow.camera.right = d;
        KingsGame.dirLight.shadow.camera.top = d;
        KingsGame.dirLight.shadow.camera.bottom = -d;
        KingsGame.dirLight.shadow.camera.near = 3;
        KingsGame.dirLight.shadow.camera.far = 50;
        KingsGame.dirLight.shadow.camera.fov = 50;
        KingsGame.dirLight.shadow.bias = -0.0001;
        KingsGame.dirLight.shadow.camera.visible = true;
        KingsGame.scene.add( KingsGame.dirLight );

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
        KingsGame.sky = new THREE.Mesh( skyGeo, skyMat );
        KingsGame.scene.add( KingsGame.sky );

        KingsGame.CAMERA_TYPES = {
            "firstPerson" : 0,
            "thirdPerson" : 1,
            "upView" : 2,
        };
        KingsGame.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        KingsGame.camera.position.set(0,5,0);
        KingsGame.camera.up = new THREE.Vector3(0,0,1);
        KingsGame.camera.lookAt(new THREE.Vector3(0,0,0));
        KingsGame.camera.type = KingsGame.CAMERA_TYPES.thirdPerson;

        KingsGame.listener = new THREE.AudioListener();
		KingsGame.camera.add( KingsGame.listener );

        var audioLoader = new THREE.AudioLoader(KingsGame.manager);
        var sound = new THREE.Audio( KingsGame.listener );
		audioLoader.load( './assets/sounds/running_hell.mp3', function( buffer ) {
			sound.setBuffer( buffer );
			sound.setLoop(true);
			sound.setVolume(0.0);
			sound.play();
		});

        KingsGame.renderer = new THREE.WebGLRenderer( { antialias: true } );
        KingsGame.renderer.setSize( window.innerWidth, window.innerHeight );
        KingsGame.renderer.setPixelRatio( window.devicePixelRatio );
        KingsGame.renderer.shadowMap.enabled = true;
        KingsGame.renderer.shadowMapSoft = true;
        KingsGame.renderer.shadowMap.type = THREE.PCFShadowMap;
        KingsGame.renderer.autoClear = false;
        $(this).append( KingsGame.renderer.domElement );

        KingsGame.stats = new Stats();
		$(this).append( KingsGame.stats.dom );

        window.addEventListener( 'resize', KingsGame.prototype.onWindowResize, false );
        document.addEventListener( 'keydown', KingsGame.prototype.onKeyDown, false );
        document.addEventListener( 'keyup', KingsGame.prototype.onKeyUp, false );
        document.addEventListener( 'mousemove', KingsGame.prototype.onMouseMove, false );

        KingsGame.prototype.render();
    };
}));

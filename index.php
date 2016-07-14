<!DOCTYPE html>
<html>
<head>
    <title>Mulimetia Interactiva</title>
    <script type="text/javascript" src="js/dist/main.bundle.js"></script>
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <link rel="stylesheet" type="text/css" href="css/styles.css">
</head>
<body>
    <script type="x-shader/x-vertex" id="vertexShader">
		varying vec3 vWorldPosition;
		void main() {
			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xzy;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	</script>

	<script type="x-shader/x-fragment" id="fragmentShader">
		uniform vec3 topColor;
		uniform vec3 bottomColor;
		uniform float offset;
		uniform float exponent;
		varying vec3 vWorldPosition;
		void main() {
			float h = normalize( vWorldPosition + offset ).y;
			gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
		}
	</script>
    <div id="blocker">
        <div id="instructions">
			<span>Click to play</span>
			<br />
			(W, A, S, D = Move, MOUSE = Look around)
		</div>
    </div>
    <div id="scoreContainer">
		<div id="score">
			<span>Puntuacion: </span>
			<span id="puntuacion">0</span>
		</div>
	</div>
    <div id="gameContainer"></div>
</body>
</html>

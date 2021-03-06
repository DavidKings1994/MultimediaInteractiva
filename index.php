<!DOCTYPE html>
<html>
<head>
    <title>Mulimetia Interactiva</title>
    <script type="text/javascript" src="js/dist/main.bundle.js"></script>
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
    <meta name="author" content="David Reyes">
    <meta name="keywords" content="David,Reyes,programador,web,multimedia,interactiva,lmad,uanl,infinite,runner,hell,scape">
    <meta name="description" content="proyecto final de la materia de multimedia y animacion digital de LMAD en FCFM">
    <link rel="shortcut icon" type="image/x-icon" href="img/logo.png" />`
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <link rel="stylesheet" type="text/css" href="css/styles.css">
    <link rel="stylesheet" type="text/css" href="css/views/loadingScreen.css">
    <link rel="stylesheet" type="text/css" href="css/views/gameOverScreen.css">
    <link rel="stylesheet" type="text/css" href="css/views/leaderboard.css">
    <link rel="stylesheet" type="text/css" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
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

    <script id="fragmentShaderLava" type="x-shader/x-fragment">
    uniform float time;
	uniform vec2 resolution;

	uniform float fogDensity;
	uniform vec3 fogColor;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

	varying vec2 vUv;

	void main( void ) {

		vec2 position = -1.0 + 2.0 * vUv;

		vec4 noise = texture2D( texture1, vUv );
		vec2 T1 = vUv + vec2( 1.5, -1.5 ) * time  *0.02;
		vec2 T2 = vUv + vec2( -0.5, 2.0 ) * time * 0.01;

		T1.x += noise.x * 2.0;
		T1.y += noise.y * 2.0;
		T2.x -= noise.y * 0.2;
		T2.y += noise.z * 0.2;

		float p = texture2D( texture1, T1 * 2.0 ).a;

		vec4 color = texture2D( texture2, T2 * 2.0 );
		vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

		if( temp.r > 1.0 ){ temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
		if( temp.g > 1.0 ){ temp.rb += temp.g - 1.0; }
		if( temp.b > 1.0 ){ temp.rg += temp.b - 1.0; }

		gl_FragColor = temp;

		float depth = gl_FragCoord.z / gl_FragCoord.w;
		const float LOG2 = 1.442695;
		float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
		fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

		gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

	}
    </script>

    <script id="vertexShaderLava" type="x-shader/x-vertex">
    uniform vec2 uvScale;
	varying vec2 vUv;

	void main()
	{
		vUv = uvScale * uv;
		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		gl_Position = projectionMatrix * mvPosition;
	}
    </script>
    <div id="blocker">
        <div id="instructions">
            <span>Click to play</span>
            <br />
            (W, A, S, D = Move, C = Change camera, R = Reset)
        </div>
    </div>
    <div id="scoreContainer">
        <div id="score">
            <span>Distance: </span>
            <span id="puntuacion">0</span>
        </div>
    </div>
    <div id="gameContainer"></div>

    <script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-81888438-1', 'auto');
    ga('send', 'pageview');

    </script>
</body>
</html>


var count = 0;

var canvas;
var gl;

var ProgramObj1 ={};
var ProgramObj2 = {} ;
var programObj ; // the current program object
var program ; //the current program ID

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var TIME = 0.0; // Realtime
var resetTimerFlag = true;
var animFlag = true;
var prevTime = 0.0;
var useTextures = 1;

//------------Damian Stuff----------------
var flag = 1;
var flag2 = 1;
//--------------------------------------

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i = 0; i < texSize; i++)  image1[i] = new Array();
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        for (var k = 0; k < 4; k++)
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];


var textureArray = [];



function isLoaded(im) {
    if (im.complete) {
        console.log("loaded");
        return true;
    }
    else {
        console.log("still not loaded!!!!");
        return false;
    }
}

function loadFileTexture(tex, filename) {
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename;
    tex.isTextureReady = false;
    tex.image.onload = function () { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;

    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.GL_REPEAT); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.GL_REPEAT); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;

}

function initTextures() {

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "wall.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "wall.jpg");

    textureArray.push({});
    loadImageTexture(textureArray[textureArray.length - 1], image2);


}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src);

    textureObj.isTextureReady = true;
}

//----------------------------------------------------------------

function setColor(c) {
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}

function toggleTextures() {
    useTextures = 1 - useTextures;
    gl.uniform1i(gl.getUniformLocation(program,
        "useTextures"), useTextures);
}

function waitForTextures1(tex) {
    setTimeout(function () {
        console.log("Waiting for: " + tex.image.src);
        wtime = (new Date()).getTime();
        if (!tex.isTextureReady) {
            console.log(wtime + " not ready yet");
            waitForTextures1(tex);
        }
        else {
            console.log("ready to render");
            window.requestAnimFrame(render);
        }
    }, 5);

}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
			   		console.log("Image file:"+texs[i].name) ;
                    n = n+texs[i].isTextureReady ;
					if( texs[i].isTextureReady != true) console.log("Texture " + texs[i].name + " is not ready") ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " Textures not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
			   		init2() ;
			   
			   }
               },5) ;
    
}

// set uniforms that never change during execution and init others
setActiveTextures = function(programObj) {
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
	
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
	
	//gl.activeTexture(gl.TEXTURE2);
	//gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
	
	console.log("---- all units activated and bound") ;
}

// set uniforms that never change during execution and init others
setUniformsOnce = function(programObj) {
    gl.uniform1i(gl.getUniformLocation(programObj.program, "texture1"), 0);
    gl.uniform1i(gl.getUniformLocation(programObj.program, "texture2"), 1);

	gl.uniform1i(gl.getUniformLocation(programObj.program, "texture3"), 2);
	
    // set a default material
    setColor(materialDiffuse) ;
	
	//set the use texture variable
    gl.uniform1i( gl.getUniformLocation(programObj.program, "useTextures"), useTextures );
	
}

// set uniform locations that may change per render call
setUniformLocations = function (programObj) {
    programObj.useTexturesLoc = gl.getUniformLocation(programObj.program, "useTextures") ;
    
    // record the locations of the matrices that are used in the shaders
    programObj.modelViewMatrixLoc = gl.getUniformLocation( programObj.program, "modelViewMatrix" );
    programObj.normalMatrixLoc = gl.getUniformLocation( programObj.program, "normalMatrix" );
    programObj.projectionMatrixLoc = gl.getUniformLocation( programObj.program, "projectionMatrix" );
}

setUniforms = function(programObj)
{
    gl.uniform1i( programObj.useTexturesLoc, useTextures );
    // send all the matrices to current program
    setAllMatrices() ;
    
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    ProgramObj1.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( ProgramObj1.program );
    program = ProgramObj1.program;
    
    ProgramObj2.program = initShaders( gl, "vertex-shader-perPixel", "fragment-shader-perPixel" );
    gl.useProgram( ProgramObj2.program );
    program = ProgramObj2.program;
    console.log("----------------") ;
    console.log(program);

    // load and initialize the textures
	initTextures() ;
	
	// Recursive wait for the textures to load
	waitForTextures(textureArray) ;

}

// init2 called after textures are loaded
function init2() {
	
	console.log("--textures loaded") ;
	
	setActiveTextures() ;
	myUseProgramObj(ProgramObj1) ;
	setUniformsOnce(ProgramObj1) ;
	setUniformLocations(ProgramObj1) ;
	myUseProgramObj(ProgramObj2)
	setUniformsOnce(ProgramObj2) ;
	setUniformLocations(ProgramObj2) ;
	
    // Load canonical objects and their attributes
    Cube.init(ProgramObj1.program);
    Cylinder.init(9,ProgramObj1.program);
    Cone.init(9,ProgramObj1.program) ;
    Sphere.init(20,ProgramObj1.program) ;
    
    /*
    
    // set the callbacks for the UI elements
    document.getElementById("sliderXi").oninput = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };
    
    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    */

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
	
	// call render
	window.requestAnimFrame(render);

}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(programObj.modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(programObj.normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(programObj.projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV();
    Sphere.draw();
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

function cubeHelper(tx, ty, tz, sx, sy, sz, rx, ry, rz, theta) {
    gTranslate(tx, ty, tz);
    gRotate(theta, rx, ry, rz);
    gScale(sx, sy, sz);
    drawCube()
    gScale(1 / sx, 1 / sy, 1 / sz);
}

function cylinderHelper(tx, ty, tz, sx, sy, sz, rx, ry, rz, theta) {
    gTranslate(tx, ty, tz);
    gRotate(theta, rx, ry, rz);
    gScale(sx, sy, sz);
    drawCylinder()
    gScale(1 / sx, 1 / sy, 1 / sz);
}

function coneHelper(tx, ty, tz, sx, sy, sz, rx, ry, rz, theta) {
    gTranslate(tx, ty, tz);
    gRotate(theta, rx, ry, rz);
    gScale(sx, sy, sz);
    drawCone()
    gScale(1 / sx, 1 / sy, 1 / sz);
}

function sphereHelper(tx, ty, tz, sx, sy, sz, rx, ry, rz, theta) {
    gTranslate(tx, ty, tz);
    gRotate(theta, rx, ry, rz);
    gScale(sx, sy, sz);
    drawSphere()
    gScale(1 / sx, 1 / sy, 1 / sz);
}

function drawBullet(x, y, z, t) {
    gPush(); {
        var i = 1/6;
        setColor(vec4(218 / 255, 165 / 255, 32 / 255, 1.0));
        cubeHelper(x + 2.5*t, y, z, 2 / 3 * i, 1 / 2 * i, 1 / 2 * i, 0, 0, 1, 0); //Shell1

        gPush(); {
            setColor(vec4(80 / 255, 50 / 255, 20 / 255, 1.0));
            cubeHelper(1/6, 0, 0, 2 / 3 * i, 1 / 3 * i, 1 / 3 * i, 0, 0, 1, 0); //Shell2
            setColor(vec4(218 / 255, 165 / 255, 32 / 255, 1.0));
            coneHelper(1/6, 0, 0, 1 / 2 * i, 1 / 2 * i, 2 / 3 * i, 0, 1, 0, 90) //Tip1
            setColor(vec4(80 / 255, 50 / 255, 20 / 255, 1.0));
            coneHelper(0, 0, 0, 1 / 3 * i, 1 / 3 * i, 2 / 3 * i, 0, 1, 0, 0) //Tip2
        } gPop();

    } gPop();
}

function drawCar(x, y, z, rotate, colorCtrl) {

    gPush(); {
        gRotate(rotate, 0, 1, 0); //rotate car
        gTranslate(TIME * 2, 0, 0); //move car
        if(colorCtrl == 0){
            setColor(vec4(0.1, 0.1, 0.1, 1.0)); // grey
        } else if (colorCtrl == 1){
            setColor(vec4(128 / 255, 0.0, 0.0, 1.0)); // maroon
        } else if (colorCtrl == 2){
            setColor(vec4(85 / 255, 107 / 255, 47 / 255, 1.0)); // green
        } else{
            setColor(vec4(25 / 255, 25 / 255, 112 / 25, 1.0)); // blue
        }
        cubeHelper(x, y, z, 4, 1, 2, 0, 0, 1, 0); //Body

        gPush(); {
            setColor(vec4(0.0, 0.0, 0.0, 1.0)); // black
            sphereHelper(3, -1, 2, 1, 1, 1 / 8, 0, 0, 1, -TIME * 180 / 3.14159); //FRWheel
            gPush(); {
                setColor(vec4(1, 1, 1, 1.0));
                sphereHelper(1 / 2, 0, .1, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FRRim1
                sphereHelper(-1, 0, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FRRim2
                sphereHelper(1 / 2, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FRRim3
                sphereHelper(0, -1, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FRRim4
                sphereHelper(0, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FRRimMid
            } gPop();
        } gPop();

        gPush(); {
            setColor(vec4(0.0, 0.0, 0.0, 1.0)); // black
            sphereHelper(3, -1, -2, 1, 1, 1 / 8, 0, 0, 1, -TIME * 180 / 3.14159); //FLWheel
            gPush(); {
                setColor(vec4(1, 1, 1, 1.0));
                sphereHelper(1 / 2, 0, -.1, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FLRim1
                sphereHelper(-1, 0, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FLRim2
                sphereHelper(1 / 2, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FLRim3
                sphereHelper(0, -1, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FLRim4
                sphereHelper(0, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //FLRimMid
            } gPop();
        } gPop();

        gPush(); {
            setColor(vec4(0.0, 0.0, 0.0, 1.0)); // black
            sphereHelper(-3, -1, 2, 1, 1, 1 / 8, 0, 0, 1, -TIME * 180 / 3.14159); //BRWheel
            gPush(); {
                setColor(vec4(1, 1, 1, 1.0));
                sphereHelper(1 / 2, 0, .1, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BRRim1
                sphereHelper(-1, 0, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BRRim2
                sphereHelper(1 / 2, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BRim3
                sphereHelper(0, -1, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BRRim4
                sphereHelper(0, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BRRimMid
            } gPop();
        } gPop();

        gPush(); {
            setColor(vec4(0.0, 0.0, 0.0, 1.0)); // black
            sphereHelper(-3, -1, -2, 1, 1, 1 / 8, 0, 0, 1, -TIME * 180 / 3.14159); //BLWheel
            gPush(); {
                setColor(vec4(1, 1, 1, 1.0));
                sphereHelper(1 / 2, 0, -.1, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BLRim1
                sphereHelper(-1, 0, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BLRim2
                sphereHelper(1 / 2, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BLRim3
                sphereHelper(0, -1, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BLRim4
                sphereHelper(0, 1 / 2, 0, 1 / 6, 1 / 6, 1 / 8, 0, 0, 1, 0); //BLRimMid
            } gPop();
        } gPop();

        if(colorCtrl == 0){
            setColor(vec4(0.1, 0.1, 0.1, 1.0)); // grey
        } else if (colorCtrl == 1){
            setColor(vec4(128 / 255, 0.0, 0.0, 1.0)); // maroon
        } else if (colorCtrl == 2){
            setColor(vec4(85 / 255, 107 / 255, 47 / 255, 1.0)); // green
        } else{
            setColor(vec4(25 / 255, 25 / 255, 112 / 25, 1.0)); // blue
        }

        gPush(); {
            cubeHelper(0, 8 / 5, 0, 9 / 5, 1, 1.9, 0, 0, 1, 0); //Top
        } gPop();

        gPush(); {
            setColor(vec4(1.0, 1.0, 0.0, 1.0));
            sphereHelper(4, 1 / 3, 1, 1 / 8, 1 / 2, 1 / 2, 0, 0, 1, 0); //FRLight
            sphereHelper(0, 0, -2, 1 / 8, 1 / 2, 1 / 2, 0, 0, 1, 0); //FLLight
        } gPop();

        gPush(); {
            setColor(vec4(176 / 255, 196 / 255, 222 / 255, 1.0));
            cubeHelper(9 / 5, 9 / 5, 0, 1 / 20, 14 / 20, 32 / 20, 0, 0, 1, 0); //Windsheild
        } gPop();

    } gPop();

}

function drawPerson(x, y, z, ctrl, rotate) {
    gPush(); {
        setColor(vec4(0.0, 0.0, 0.0, 1.0));
        gRotate(rotate, 0, 1, 0); //rotate person
        setColor(vec4(139 / 255, 69 / 255, 19 / 255, 1.0)) //brown
        sphereHelper(x, y, z, 1 / 5, 1 / 5, 1 / 3, 0, 0, 1, 0); //LFoot
        setColor(vec4(192 / 255, 192 / 255, 192 / 255, 1.0)) //grey


        gPush(); {
            setColor(vec4(139 / 255, 69 / 255, 19 / 255, 1.0)) //brown
            sphereHelper(2 / 3, 0, 0, 1 / 5, 1 / 5, 1 / 3, 0, 0, 1, 0); //RFoot
            setColor(vec4(192 / 255, 192 / 255, 192 / 255, 1.0)) //grey

            gPush(); {
                if (ctrl == 1 & TIME > 27) {
                    sphereHelper(0, 1 / 2, -1 / 5, 1 / 5, 1 / 2, 1 / 5, 1, 0, 0, -Math.abs(Math.sin((TIME - 27) / 9) * 10)); //RShin
                } else {
                    sphereHelper(0, 1 / 2, -1 / 5, 1 / 5, 1 / 2, 1 / 5, 1, 0, 0, 0); //RShin
                }

                gPush(); {
                    if (ctrl == 1 & TIME > 27) {
                        sphereHelper(0, 5 / 10, 0, 1 / 5, 1 / 5, 1 / 5, 1, 0, 0, -Math.abs(Math.sin((TIME - 27) / 9) * 35)); // RKnee
                    } else {
                        sphereHelper(0, 5 / 10, 0, 1 / 5, 1 / 5, 1 / 5, 1, 0, 0, 0); // RKnee
                    }

                    gPush(); {
                        sphereHelper(0, .7, 0, 1 / 4, 2 / 3, 1 / 4, 0, 0, 1, 0); //RLeg

                        gPush(); {
                            sphereHelper(0, 2 / 3, 0, 1 / 4, 1 / 4, 1 / 4, 0, 0, 1, 0); // RHip

                        } gPop();

                    } gPop();

                } gPop();

            } gPop();

        } gPop();

        gPush(); {
            if (ctrl == 1 & TIME > 27) {
                sphereHelper(0, 1 / 2, -1 / 5, 1 / 5, 1 / 2, 1 / 5, 1, 0, 0, -Math.abs(Math.sin((TIME - 27) / 9) * 10)); //LShin
            } else {
                sphereHelper(0, 1 / 2, -1 / 5, 1 / 5, 1 / 2, 1 / 5, 1, 0, 0, 0); //LShin
            }

            gPush(); {
                if (ctrl == 1 & TIME > 27) {
                    sphereHelper(0, 5 / 10, 0, 1 / 5, 1 / 5, 1 / 5, 1, 0, 0, -Math.abs(Math.sin((TIME - 27) / 9) * 35)); // LKnee
                } else {
                    sphereHelper(0, 5 / 10, 0, 1 / 5, 1 / 5, 1 / 5, 1, 0, 0, 0); // LKnee
                }

                gPush(); {
                    sphereHelper(0, .7, 0, 1 / 4, 2 / 3, 1 / 4, 0, 0, 1, 0); //LLeg

                    gPush(); {
                        if (ctrl == 1 & TIME > 27) {
                            sphereHelper(0, 2 / 3, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, -Math.abs(Math.sin((TIME - 27) / 9) * 35)); // LHip
                        } else {
                            sphereHelper(0, 2 / 3, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, 0); // LHip
                        }

                        gPush(); {
                            setColor(vec4(0, 0, 0, 1.0)) //grey
                            sphereHelper(8 / 25, 11 / 10, 0, 5 / 8, 5 / 4, 5 / 8, 0, 0, 1, 0); //Torso
                            setColor(vec4(1, 218 / 255, 185 / 255, 1.0)) //peach

                            gPush(); {
                                if (ctrl == 1 & TIME > 27) {
                                    sphereHelper(1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, ((TIME - 27)/ 4.5) * 170 / 3.14159); //LShoulder
                                
                                } else if (ctrl == 1 & TIME > 35) {
                                    sphereHelper(1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, ((TIME - 27)/ 4.5) * 120 / 3.14159); //LShoulder
                                }
                                 else {
                                    sphereHelper(1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, 0); //LShoulder
                                }
                                sphereHelper(1 / 3, -3 / 10, 0, 1 / 5, 1 / 2, 1 / 5, 0, 0, 1, 30); //LBi
                                sphereHelper(0, -1 / 2, 0, 1 / 6, 1 / 6, 1 / 6, 0, 0, 1, 0); // LElbow
                                sphereHelper(-1 / 10, -4 / 10, 0, 1 / 6, 1 / 2, 1 / 6, 0, 0, 1, -20); //LFore
                            } gPop();

                            if (ctrl == 1 & TIME > 27) {
                                gPush(); {
                                    if (ctrl == 1 & TIME > 27) {
                                        sphereHelper(-1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, -((TIME - 27)/ 4.5) * 200 / 3.14159 + 0); //LShoulder
                                    } else {
                                        sphereHelper(-1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, 0); //LShoulder
                                    }
                                    sphereHelper(-1 / 3, -3 / 10, 0, 1 / 5, 1 / 2, 1 / 5, 0, 0, 1, -30); //LBi
                                    sphereHelper(0, -1 / 2, 0, 1 / 6, 1 / 6, 1 / 6, 0, 0, 1, 0); // LElbow
                                    sphereHelper(1 / 10, -4 / 10, 0, 1 / 6, 1 / 2, 1 / 6, 0, 0, 1, 20); //LFore
                                } gPop();
                            }

                            gPush(); {
                                
                                if (ctrl == 0 & flag == 1 & TIME > 23) {
                                    sphereHelper(-1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, -Math.abs(Math.sin((TIME - 23)) * 90));
                                    if (Math.abs(Math.sin(TIME - 23) * 90) > 89.9) {
                                        flag = 0;
                                    }
                                } else if (ctrl == 0 & TIME > 24.5) {
                                    sphereHelper(-1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, -90);
                                } else {
                                    if(ctrl == 0){
                                        sphereHelper(-1 / 2, 4 / 5, 0, 1 / 4, 1 / 4, 1 / 4, 1, 0, 0, 0);
                                    }
                                }

                                if(ctrl == 0){
                                    sphereHelper(-1 / 3, -3 / 10, 0, 1 / 5, 1 / 2, 1 / 5, 0, 0, 1, -30); //RBi
                                }

                                gRotate(30, 0, 1, 0);
                                if (ctrl == 1 & TIME > 25) {
                                    sphereHelper(0, -1 / 2, 0, 1 / 6, 1 / 6, 1 / 6, 0, 0, 1, 0); // RElbow
                                } else if (ctrl == 0 & flag == 2 & TIME > 25) {
                                    sphereHelper(0, -1 / 2, 0, 1 / 6, 1 / 6, 1 / 6, 1, 0, 0, -Math.abs(Math.sin((TIME - 25)) * 35)); // RElbow
                                    if (Math.abs(Math.sin(TIME) * 35) > 34.5) {
                                        flag2 = 0;
                                    }
                                    if (Math.abs(Math.sin(TIME) * 35) < 1 & flag2 == 0) {
                                        flag = -1;
                                    }
                                } else {
                                    if(ctrl == 0){
                                        sphereHelper(0, -1 / 2, 0, 1 / 6, 1 / 6, 1 / 6, 0, 0, 1, 0); // RElbow
                                    }
                                }
                                gRotate(-30, 0, 1, 0);
                                if (Math.abs(Math.sin(TIME) * 35) < .5 & flag == 0) {
                                    flag = 2;
                                }

                                if(ctrl == 0){
                                    sphereHelper(1 / 10, -4 / 10, 0, 1 / 6, 1 / 2, 1 / 6, 0, 0, 1, 20); //RFore
                                }

                                if (ctrl == 0) {
                                    setColor(vec4(0, 0, 0, 1.0));
                                    cubeHelper(0, -1 / 2, 0, 1 / 8, 1 / 8, 1 / 3, 0, 0, 1, 0); //Gun Handle
                                    cubeHelper(0, -.4, .3, 1 / 8, 1 / 2, 1 / 8, 0, 0, 1, 0); //Gun Barrel
                                }
                            } gPop();

                            gPush(); {
                                setColor(vec4(1, 218 / 255, 185 / 255, 1.0)) //peach
                                sphereHelper(0, 18 / 10, 0, 3 / 5, 3 / 5, 3 / 5, 0, 0, 1, 0); //Head 

                            } gPop();

                        } gPop();

                    } gPop();

                } gPop();

            } gPop();

        } gPop();

    } gPop();

}

function  myUseProgramObj(po) {
    gl.useProgram(po.program) ;
    program = po.program ;
    programObj = po
   
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Move the camera, make sure to bring reference point and eye together
    if (TIME < 3){//street view centering
        at = vec3(-3 + TIME,-3 + TIME,0);
        eye = vec3(3 - TIME,3 - TIME,15);

    } else if (TIME > 3 & TIME < 6){//street view
        at = vec3(0,0,0);
        eye = vec3(0,0,15);

    } else if (TIME > 6 & TIME < 17){//travel up bilding
        at = vec3((TIME - 6) * 1.1,(TIME - 6) * 4.9,0);
        eye = vec3((TIME - 6) * 1.64,(TIME - 6) * 5.2,15);

    } else if (TIME > 17 & TIME < 20){//look at neo
        at = vec3(12,53.9,0);
        eye = vec3(18,57.2,15);

    } else if (TIME > 20 & TIME < 23){//turn to agent smith
        at = vec3(12  - (TIME - 20) * 4,53.9,0);
        eye = vec3(18  - (TIME - 20) * 2,57.2,15);

    } else if (TIME > 23 & TIME < 26){//stop for gunshot
        at = vec3(0,53.9,0);
        eye = vec3(12,57.2,15);

    } else if (TIME > 26 & TIME < 30){//follow bullet
        at = vec3(0  + (TIME - 26) * 2,53.9 - ((TIME - 26) * .45),-(TIME - 26) * 1.5);
        eye = vec3(12 - (TIME - 26),57.2,15);

    } else if (TIME > 30 & TIME < 47.9){//neo 360
        at = vec3(8,52.1, -7);
        eye = vec3(8 - (Math.sin((TIME - 30)/3) * 8),57.2 + (TIME - 30) / 20,(Math.cos((TIME - 30) / 3) * 15));

    } else if (TIME > 47.9) { //stop camera at end
        at = vec3(8,52.1, -7);
        eye = vec3(8,58.5,15);
    }

    eye[1] = eye[1] + 0;

    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // initialize the modeling matrix stack
    MS = [];
    modelMatrix = mat4();

    // apply the slider rotations
    gRotate(RZ, 0, 0, 1);
    gRotate(RY, 0, 1, 0);
    gRotate(RX, 1, 0, 0);

    // send all the matrices to the shaders
    setAllMatrices();

    // get real time
    var curTime;
    if (animFlag) {
        curTime = (new Date()).getTime() / 1000;
        if (resetTimerFlag) {
            prevTime = curTime;
            resetTimerFlag = false;
        }
        TIME = TIME + curTime - prevTime;
        prevTime = curTime;
    }
    
    //1st shadder
    myUseProgramObj(ProgramObj2);
    setUniforms(ProgramObj2) ;

    //World Floor
    gPush(); {
        setColor(vec4(.6, .76, .8, 1.0));
        gTranslate(0, -5.7, 0);
        gScale(50, 1, 50);
        drawCube()
        gScale(1 / 10, 1 / 10, 1 / 10);
    } gPop();

    //Road
    gPush(); {
        setColor(vec4(0, 0, 0, 1.0));
        gTranslate(0, -5.69, 7);
        gScale(50, 1, 8);
        drawCube()
        gScale(1 / 10, 1 / 10, 1 / 10);
    } gPop();

    //Street Lines
    gPush(); {
        setColor(vec4(1, 1, 0, 1.0));
        gScale(50, 1, 1/4);
        gTranslate(0, -5.68, 22);
        drawCube()
    } gPop();
    gPush(); {
        setColor(vec4(1, 1, 0, 1.0));
        gScale(50, 1, 1/4);
        gTranslate(0, -5.68, 26);
        drawCube()
    } gPop();

    //Roof
    gPush(); {
        setColor(vec4(.8, .8, .8, 1.0));
        gTranslate(0, 49.7, -24);
        gScale(20.5, 1/2, 20.5);
        drawCube()
    } gPop();

    //people
    if (TIME > 13){
    drawPerson(-8, 50.3, -7, 1, -90);
    drawPerson(8, 50.3, -7, 0, 90);
    }

    //cars
    if (TIME < 8) {
        drawCar(-5, -2.7, -3, 180, 0);
        drawCar(-8, -2.7, 12, 0, 1);

        drawCar(-15, -2.7, -3, 180, 2);
        drawCar(-22, -2.7, 12, 0, 3);
    }    

    //bullets
    if (TIME < 55){
        if(TIME > 25.2){
            drawBullet(-4.8, 55, -6.9, TIME - 25.2);
        }
        if(TIME > 28){
            drawBullet(-7.5, 54.8, -7.5, TIME - 28);
        }
        if(TIME > 31){
            drawBullet(-7.5, 54, -7.5, TIME - 31);
        }
        if(TIME > 34){
            drawBullet(-7.5, 53.5, -9, TIME - 34);
        }
        if(TIME > 37){
            drawBullet(-7.5, 54.5, -8, TIME - 37);
        }
        if(TIME > 40){
            drawBullet(-7.5, 55, -5.5, TIME - 40);
        }
        if(TIME > 43){
            drawBullet(-7.5, 56, -5, TIME - 43);
        }
    }

    //2nd shader (bricks)
    myUseProgramObj(ProgramObj1);
    setUniforms(ProgramObj1) ;

    //Building
    gPush(); {

        setColor(vec4(.2, .8, 1, 1.0));
        gScale(20, 50, 20);
        gTranslate(0, 0, -1.2);
        drawCube()

    } gPop();

    if (animFlag)
        if (TIME < 55){
            window.requestAnimFrame(render);
            count = count + 1;

            if (TIME % 2 < .2){
                FR = count / 2;
                if(FR != .5){
                    console.log("Frame Rate = " + FR);
                }
                count = 0;
            }
        }
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function (ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function (ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function (ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}

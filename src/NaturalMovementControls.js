import * as THREE from "three";
import {
	Euler,
	EventDispatcher,
	Vector3
} from "three/build/three.module";
import p5 from "p5";

class NaturalMovementControls {

    constructor(object, domElement) {

        this.p5 = new p5();

        if ( domElement === undefined ) {
            console.warn( 'THREE.FirstPersonControls: The second parameter "domElement" is now mandatory.' );
            this.domElement = document.body;
    
        }

        this.object = object;
        this.euler = new Euler( 0, 0, 0, 'YXZ' );
        this.PI_2 = Math.PI / 2;
        this.velocity = new THREE.Vector3();
        this.vec = new Vector3();
        this.direction = new Vector3();
        this.isLocked = false; 
        this.prevTime = performance.now();

        this.dummyObject = new THREE.Object3D();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.cameraXIncrement = 0;
        this.cameraYIncrement = 1000;
        this.cameraZIncrement = 2000;

        this.lockEvent = { type: 'lock' };
	    this.unlockEvent = { type: 'unlock' };

        this.clock = new THREE.Clock();
        this.movementSpeed = 1.0;
        this.viewHalfX = 0;
	    this.viewHalfY = 0;

        var _onPointerlockChange = this.onPointerlockChange.bind( this );
        var _onMouseMove = this.onMouseMove.bind( this );
        var _onKeyDown = this.onKeyDown.bind( this );
        var _onKeyUp= this.onKeyUp.bind( this );

        this.domElement.addEventListener( 'mousemove', _onMouseMove, false );
        window.addEventListener( 'keydown', _onKeyDown, false );
        window.addEventListener( 'keyup', _onKeyUp, false );
        document.addEventListener( 'pointerlockchange', _onPointerlockChange, false );

    }

    onMouseMove( event ) {

		if ( this.isLocked === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		this.euler.setFromQuaternion( this.dummyObject.quaternion );

		this.euler.y -= movementX * 0.002;
		this.euler.x -= movementY * 0.002;

        this.euler.x = Math.max( - this.PI_2, Math.min( this.PI_2, this.euler.x ) );
        this.dummyObject.quaternion.setFromEuler( this.euler );
          
    }

    onPointerlockChange() {
        console.log("yo");

		if ( document.pointerLockElement === this.domElement ) {

			this.dispatchEvent( this.lockEvent );

			this.isLocked = true;

		} else {

			this.dispatchEvent( this.unlockEvent );

			this.isLocked = false;

		}

	}
    
    lock() {
        this.domElement.requestPointerLock();
	}

	unlock() {
		document.exitPointerLock();
    }

    getObject() { // retaining this method for backward compatibility

		return this.object;

	};
    
    moveForwardAction( distance ) {

		// move forward parallel to the xz-plane
		// assumes camera.up is y-up

		this.vec.setFromMatrixColumn( this.object.matrix, 0 );

		this.vec.crossVectors( this.object.up, this.vec );

		this.object.position.addScaledVector( this.vec, distance );

    }
    
    moveRightAction( distance ) {

		this.vec.setFromMatrixColumn( this.object.matrix, 0 );

		this.object.position.addScaledVector( this.vec, distance );

	}

    onKeyDown( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

		}
	}

	onKeyUp( event ) {

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

    }

    getDirection() {

		var direction = new Vector3( 0, 0, - 1 );

		return function ( v ) {

			return v.copy( direction ).applyQuaternion( this.dummyObject.quaternion );

		};

	}

    getNoiseValues() {
        let xNoise = this.p5.noise(this.cameraXIncrement);
        let yNoise = this.p5.noise(this.cameraYIncrement);
        let zNoise = this.p5.noise(this.cameraZIncrement);

        this.cameraXIncrement += 0.006;
        this.cameraYIncrement += 0.006;
        this.cameraZIncrement += 0.006;

        return {
            x: xNoise,
            y: yNoise,
            z: zNoise
        }
    }
    
    update() {
        if ( this.isLocked === true ) {
            let noise = this.getNoiseValues();
            this.object.quaternion.setFromEuler( new Euler( this.euler.x + ((1 - (noise.x * 2)) * 0.2), this.euler.y + ((1 - (noise.y * 2)) * 0.2), this.euler.z + ((1 - (noise.z * 2)) * 0.2), 'YXZ' ) );  
            let time = performance.now();0
            let delta = ( time - this.prevTime ) / 1000;

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            
            this.direction.z = Number( this.moveForward ) - Number( this.moveBackward );
            this.direction.x = Number( this.moveRight ) - Number( this.moveLeft );
            this.direction.normalize(); // this ensures consistent movements in all directions

            if ( this.moveForward || this.moveBackward ) this.velocity.z -= this.direction.z * 100.0 * delta;
            if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 100.0 * delta;
            this.moveRightAction( - this.velocity.x * delta );
            this.moveForwardAction( - this.velocity.z * delta );
            
            this.object.position.y += ( this.velocity.y * delta ); // new behavior

            if ( this.object.position.y < 10 ) {

                this.velocity.y = 0;
                this.object.position.y = 10;

            }
            
            this.prevTime = time;
        }

        
       /* let delta = this.clock.getDelta();
        let actualMoveSpeed = delta * this.movementSpeed;

        console.log(this.mouseX);

        if ( this.moveForward ) this.object.translateZ( - ( actualMoveSpeed ) );
        if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

        if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
        if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

        if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
        if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );
        */
    }

}

Object.assign( NaturalMovementControls.prototype, EventDispatcher.prototype );
export default NaturalMovementControls;
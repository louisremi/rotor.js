/*
 * rotor.js rotate3d manipulation library - lightweight and extensible
 *
 * latest version and README available on Github:
 * http://github.com/louisremi/rotor.js
 *
 * Inspired from traqball.js by dirkweber
 * MIT Licensed http://louisremi.mit-license.org/
 *
 * This saved you a day of work?
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 *
 */
(function(window,document,Math) {
"use strict";

// feature detection
var div = document.createElement("div"),
	divStyle = div.style,
	prefixes = ["O","ms","Webkit","Moz"],
	i = prefixes.length,
	_Transform = "Transform",
	_EventListener = "EventListener",
	_mouse = "mouse",
	_touch = "touch",
	_move = "move",
	eventMap = {
		down: {
			m: _mouse + "down",
			t: _touch + "start"
		},
		move: {
			m: _mouse + _move,
			t: _touch + _move,
			e: document
		},
		up: {
			m: _mouse + "up",
			t: _touch + "end",
			e: document
		}
	},
	initialRotation = {
		x: 1,
		y: 0,
		z: 0,
		a: 0
	},
	transform, raf, tmp,
	rotor;

// vendor prefix detection
while ( i-- ) {
	tmp = prefixes[i] + _Transform;
	if ( tmp in divStyle ) {
		transform = tmp;
		break;
	}
}

// rotor.js can be used only in Transform 3d compatible browsers
if ( !transform || ! ( prefixes[i] + "Perspective" in divStyle ) ) { return; }

raf = window[ prefixes[i].toLowerCase() + "RequestAnimationFrame" ];

// Constructor
function Rotor( elem, options ) {
	var bcr = elem.getBoundingClientRect(),
		center = this.center = [
			bcr.left + bcr.width / 2,
			bcr.top + bcr.height / 2
		],
		radius = this.radius = Math.min( bcr.width, bcr.height ),
		inertia = this.inertia = !options || options.inertia !== false,
		vStart, aaStart,
		aPrev, aCur, tPrev, tCur,
		self = this;

	this[0] = elem;

	// Internal event listeners for 3d rotation
	this._3axisManip = {
		down: function( e ) {
			vStart = rotor.vCalc( e.rotorX, e.rotorY, self.getRadius() );
			aaStart = self.aa;

			e.preventDefault();

		},
		move: function( e ) {
			var vCur = rotor.vCalc( e.rotorX, e.rotorY, self.getRadius() ),
				aaCur = rotor.aaCalc( vStart, vCur ),
				aaProd = rotor.aaProd( aaCur, aaStart );

			// keep angle and time in memory for inertia
			aPrev = aCur;
			tPrev = tCur;
			aCur = aaProd.a;
			tCur = Date.now();

			self.rotation( aaProd );

		},
		up: function() {
			if ( inertia && aPrev ) {
				var daMove = aCur - aPrev,
					dtMove = tCur - tPrev,
					aaCur = self.aa,
					aaLast = {
						x: aaCur.x,
						y: aaCur.y,
						z: aaCur.z,
						a: aaCur.a
					};

				raf(function anim( now ) {
					// stop the animation if another down event occured
					if ( self.down ) { return; }

					// calculates new angle
					var dtAnim = now - tCur,
						daAnim = dtAnim / dtMove * ( daMove *= .9 );

					tCur = now;
					aaLast.a += daAnim;
					self.rotation( aaLast );

					// loop as long as the movement is significant enough
					( Math.abs( daAnim ) > .01 ) && raf( anim );
				});
			}

			aPrev = +false;

		}
	};

	this.aa = initialRotation;

	this.on();
};

// Prototype
Rotor.prototype = {
	// Efficient "from memory" getter. Can easily be overriden to use getBoundingClientRect()
	getCenter: function() {
		return this.center;
	},
	// Efficient "from memory" getter. Can easily be overriden to use getBoundingClientRect()
	getRadius: function() {
		return this.radius;
	},
	// add a triplet of down,move,up listeners
	on: function( listeners ) {
		eachLstnrs( this, "on", listeners );
	},
	// remove a triplet listeners
	off: function( listeners ) {
		eachLstnrs( this, "off", listeners );
	},
	// rotate3d getter/setter
	rotation: function( aa ) {
		// function used as getter
		if ( !aa ) { return this.aa; }
		
		// otherwise it's used as setter
		this.aa = aa;
		this[0].style[ transform ] = "rotate3d(" + aa.x + "," + aa.y + "," + aa.z + "," + aa.a + "rad)";
	}
};

// Make constructor and prototype public
rotor = function( id, options ) {
	return new Rotor( id, options );
};
rotor.fn = Rotor.prototype;

/*
 * Public Utils
 */

// Calculates a vector from x/y position and a radius
rotor.vCalc = function( x, y, r ) {
	x = x / r;
	y = y / r;

	var z = 1 - x * x - y * y;

	return {
		x: x,
		y: y,
		z: z > 0 ? Math.sqrt( z ) : 0
	};
};

// Calculates an axis-angle from two vectors
rotor.aaCalc = function( start, move ) {
	var x = start.y * move.z - start.z * move.y,
		y = start.z * move.x - start.x * move.z,
		z = start.x * move.y - start.y * move.x,
		a = Math.acos(
			( start.x * move.x + start.y * move.y + start.z * move.z ) / (
				Math.sqrt( start.x * start.x + start.y * start.y + start.z * start.z ) *
				Math.sqrt( move.x * move.x + move.y * move.y + move.z * move.z )
			)
		);

	return a ? {
		x: x,
		y: y,
		z: z,
		a: a
	} : initialRotation;
};

// Returns the product of two axis-angle
rotor.aaProd = function( aa0, aa1 ) {
	return q2aa( qProd( aa2q( aa0 ), aa2q( aa1 ) ) );
};

/*
 * Private Utils
 * logic from http://euclideanspace.com/maths/geometry/rotations/conversions/
 */

// axis-angle to quaternion
function aa2q( aa ) {
	var norm = Math.sqrt( aa.x * aa.x + aa.y * aa.y + aa.z * aa.z ),
		aaah = aa.a / 2,
		s = Math.sin( aaah ) / norm;

	return {
		x: aa.x * s,
		y: aa.y * s,
		z: aa.z * s,
		w: Math.cos( aaah )
	};
}

// quaternion to axis-angle
function q2aa( q ) {
	var x, y, z, a,
		s, norm;

	if ( q.w > 1 ) {
		norm = Math.sqrt( q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w );
		q.x /= norm;
		q.y /= norm;
		q.z /= norm;
		q.w /= norm;
	}

	a = 2 * Math.acos( q.w );
	s = 1 - q.w * q.w;

	if ( s < 1E-3 ) {
		x = 1;
		y = z = 0;
	} else {
		s = Math.sqrt( s );
		x = q.x / s;
		y = q.y / s;
		z = q.z / s;
	}

	return {
		x: x,
		y: y,
		z: z,
		a: a
	}
};

// quaternion product
function qProd( q1, q2 ) {
	return {
		x:  q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x,
		y: -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y,
		z:  q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z,
		w: -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
	};
}

// factorizes "loop over listeners" code
function eachLstnrs( rtr, state, listeners ) {
	var type, listener, params, elem;

	// when no listeners are provided, use internal ones
	!listeners && ( listeners = rtr._3axisManip );

	for ( type in listeners ) {
		listener = listeners[ type ];
		params = eventMap[ type ];
		elem = params.e || rtr[0];

		listener.ref = state == "on" ?
			addMouseListener( rtr, elem, type, params.m, listener ) :
			elem[ "remove" + _EventListener ]( params.m, listener.ref, !1 );
	}
}

// enhanced addEventListener
function addMouseListener( self, elem, type, fullType, listener ) {
	var _down = "down",
		preLstnr = function( e ) {
		 	// "move" and "up" listeners should only be executed after "down" occured
			if ( type != _down && !self[ _down ] ) { return; }
			self[ _down ] = type != "up";

			var center = self.getCenter();

			// add position of the cursor relative to the center
			e.rotorX = e.pageX - center[0];
			e.rotorY = e.pageY - center[1];

			listener( e );
		};

	elem[ "add" + _EventListener ]( fullType, preLstnr, !1 );

	return preLstnr;
}

window.rotor = rotor;

})(window,document,Math)
ʀoToᴙ.js
========

`rotate3d` manipulation library

Main Features
-------------

- enables manipulation of DOM nodes on three rotation axis, as if it was wrapped in a virtual trackball
- set and get current rotation of rotor enabled nodes
- lightweight and clean code base
- built with extensibility in mind (event helpers and geometry utils included)

API
---

### rotor( elem, [options] )

Rotor constructor: enables manipulation of `elem` on three rotation axis.
The only option currently availbale is inertia, which is on by default.

```javascript
// create a new rotor instance and disable inertia
rtr = rotor( elem, { inertia: false } );
```


### .rotation( [axisAngle] )

Rotation getter/setter: modify or access the current rotation of a rotor instance

```javascript
// setter
rtr.rotation({
	x: xVal,
	y: yVal,
	z: zVal,
	a: angle
});
// getter
rtr.rotation();
```


### .on() / .off()


Enable/Disable manipulation of a rotor instance

```javascript
// disable
rtr.off();
// re-enable
rtr.on();
```

### rotor.aaProd( axisAngle0, axisAngle1 )

Combine two rotations by calculating the product of two axis-angles

```javascript
// Rotate a DOM node by 90deg on the Z axis,
// relative to its current rotation
var currentRotation = rtr.rotation(),
	zRotation = {
		x: 0,
		y: 0,
		z: 1,
		a: Math.PI / 2
	},
	newRotation = rotor.aaProd( currentRotation, zRotation );

rtr.rotation( newRotation );
```

More
----

rotor.js is easy to extend using its event helpers and geometry utils, see the wiki.

Credits & License
-----------------

Inspired from [traqball.js](http://github.com/dirkweber/traqball.js) by dirkweber

Geometry algos adapted from [euclideanspace.com](http://euclideanspace.com/maths/geometry/rotations/conversions/)

MIT Licensed http://louisremi.mit-license.org/
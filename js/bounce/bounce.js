Vector3 = function(x,y,z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
Vector3.prototype.add = function( o ) {
    var res = new Vector3( this.x, this.y, this.z );
    res.x += o.x;
    res.y += o.y;
    res.z += o.z;
    return res;
}
Vector3.prototype.multiply = function( r ) {
    var res = new Vector3( this.x, this.y, this.z );
    res.x *= r;
    res.y *= r;
    res.z *= r;
    return res;
}
Vector3.prototype.lowpass = function( t ) {
    var res = new Vector3( this.x, this.y, this.z );
    if( Math.abs(res.x) < t ) res.x = 0;
    if( Math.abs(res.y) < t ) res.y = 0;
    if( Math.abs(res.z) < t ) res.z = 0;
    return res;
}

Ball = function( radius, target ) {
    this.pos = new Vector3(0,0,0);
    this.accel = new Vector3(0,0,0);
    this.radius = radius;
    this.cradius = radius;
    this.target = target;
}

Ball.prototype.update = function( gravity ) {
    this.accel = this.accel.add( gravity.multiply( 0.2 ) );
    this.pos = this.pos.add( this.accel.multiply( 0.3 ).lowpass( threshold ) );

    if( this.pos.x - this.radius < 0 ) {
        this.pos.x = this.radius;
        this.accel.x = this.accel.x * bounce * -1;
    }
    if( this.pos.y - this.radius < 0 ) {
        this.pos.y = this.radius;
        this.accel.y = this.accel.y * bounce * -1;
    }
    if( this.pos.z - this.radius < 0 ) {
        this.pos.z = this.radius;
        this.accel.z = this.accel.z * bounce * -1;
    }
    if( this.pos.x + this.radius >= zone.x ) {
        this.pos.x = zone.x - this.radius - 1;
        this.accel.x = this.accel.x * bounce * -1;
    }
    if( this.pos.y + this.radius >= zone.y ) {
        this.pos.y = zone.y - this.radius - 1;
        this.accel.y = this.accel.y * bounce * -1;
    }
    if( this.pos.z + this.radius >= zone.z ) {
        this.pos.z = zone.z - this.radius - 1;
        this.accel.z = this.accel.z * bounce * -1;
    }
    if( this.target == null ) return;
        
    var r = 0.5 - ( this.pos.z / zone.z * 0.5 ) + 0.5;
    this.radius = this.cradius * r;
    var fr = floorRate * 0.5 + floorRate * r;
    var vx = this.pos.x * fr + ((1-fr)*0.5*zone.x) - this.radius;
    var vy = this.pos.y * fr + ((1-fr)*0.5*zone.y) - this.radius;;

    this.target.offset( { top:vy, left:vx } );
    this.target.width( parseInt(this.radius*2) );
    this.target.height( parseInt(this.radius*2) );
}

function update()
{
    if( ball )
        ball.update( gravity );
}

function isiOS()
{
    return (navigator.userAgent.match(/(iPad|iPhone|iPod)/i) != null);
}

var gravity = new Vector3(0,10,10);
var ball = null;
var zone = new Vector3(0,0,0);
var bounce = 0.4;
var threshold = 0.5;
var floorRate = 0.7;
var iOS = isiOS();

$(function() {
    ball = new Ball( 32, $('#ball') );
    zone.x = $('body').width();
    zone.y = $('body').height();
    zone.z = zone.x;

    window.ondevicemotion = function(event) {
        if( iOS )
        {
            gravity = new Vector3( 
                event.accelerationIncludingGravity.x,
                -event.accelerationIncludingGravity.y,
                -event.accelerationIncludingGravity.z
            );
        }
        else
        {
            gravity = new Vector3( 
                -event.accelerationIncludingGravity.x,
                event.accelerationIncludingGravity.y,
                event.accelerationIncludingGravity.z
            );
        }
    }
    var timer = setInterval(update, 16);
});

$(window).resize(function() {
    zone.x = $('body').width();
    zone.y = $('body').height();
    zone.z = zone.x;
});

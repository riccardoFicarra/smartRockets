var population;
var lifespan = 350;
var count = 0;
var popsize = 100;
var target;
var alive = true;
var walls = [];
var generations = 0;
var mutationRate = 0.0001;


function setup(){
    collideDebug(true);
    createCanvas(800,600);
    population = new Population();
    target = new Target(width/2, 50, 32);
    //walls[0] = new Wall(width/2+200, 0.3*height, 500, 5);
    //walls[1] = new Wall(width/2-200, 0.6*height, 500, 5);
    angleMode(RADIANS);
}
function draw(){
    background(0);
    alive = population.update();
    population.show();
    target.show();
    for(var i = 0; i<walls.length; i++)
        walls[i].show();
    count++;
    if(count === lifespan || !alive){
        count = 0;
        population.evaluate();
        population.selection();
        generations++;
    }

}
function Wall(x,y, w, h, angle){
    this.pos = createVector(x,y);
    this.width = w;
    this.height = h;
    this.show = function(){
        push();
        rectMode(CENTER);
        fill(255,255,255);
        if(angle !== undefined)
            rotate(angle);
        rect(this.pos.x, this.pos.y, this.width, this.height);
        pop();
    };
    this.hit = function(rocket){
        var vertexes = rocket.getVertexes();
        return collideRectPoly(this.pos.x-this.width/2, this.pos.y-this.height/2, this.width, this.height, vertexes);
    };

}
function Target(x, y, r){
    this.r = r;
    this.pos = createVector(x, y);

    this.show = function(){
        fill(255,255,255);
        ellipse(target.pos.x, target.pos.y, target.r,target.r);
    };
    this.hit = function(rocket){
        var vertexes = rocket.getVertexes();
        return collideCirclePoly(this.pos.x, this.pos.y, this.r, vertexes);
    };
}
function Population(){
    this.rockets = [];
    this.popsize = popsize;
    this.matingPool = [];

    for(var i = 0; i<this.popsize;i++){
        this.rockets[i] = new Rocket();
    }

    this.show = function(){
        for(var i = 0; i<this.popsize; i++){
            this.rockets[i].show();
        }
    };
    this.update = function(){
        var alive = false;
            for(var i = 0; i<this.popsize;i++){
                if(this.rockets[i].hitTarget === -1 && !this.rockets[i].hitWall)
                alive |= this.rockets[i].update();
            }
            return alive;
    };
    this.evaluate = function(){
        var maxFit = 0;
        for(i = 0; i<this.popsize; i++){
            this.rockets[i].calcFitness();
            if(this.rockets[i].fitness > maxFit){
                maxFit = this.rockets[i].fitness;
            }
        }
        console.log(maxFit);
        for(i = 0; i<this.popsize;i++){    //normalize fitness
            this.rockets[i].fitness/=maxFit;
        }

    };

    //if defined, parent skipChoice is never chosen (avoids having rockets with the same rocket as both parents)
     this.acceptReject = function(skipChoice) {
        var safety = 0;
        while(safety < 1000){
            var choice = floor(random(this.rockets.length));
            if(this.rockets[choice].fitness < random(1) || (skipChoice && choice !== skipChoice))
                return this.rockets[choice];
            safety++;
        }
    };

    this.selection = function(){
        var newRockets = [];
        for(var i = 0; i<this.rockets.length; i++){
            var parentA = this.acceptReject();
            var parentB = this.acceptReject(parentA);
            var childDNA = parentA.dna.crossover(parentB.dna);
            childDNA.mutation(mutationRate);
            var childColor;
            if(parentA.fitness > parentB.fitness)
                childColor = parentA.color;
            else
                childColor = parentB.color;
            newRockets[i] = new Rocket(childDNA, childColor);
        }
        this.rockets = newRockets;
    }


}
function DNA(genes){
    this.genes = [];
    if(genes){
        this.genes = genes;
    } else {
        for(var i = 0; i<lifespan; i++){
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(0.1);
        }
    }
    this.crossover = function(parentB){
        var newgenes = [];
        var midpoint = floor(random(this.genes.length));
        for(var i = 0; i<this.genes.length; i++){
            if(i > midpoint){
                newgenes[i] = this.genes[i];
            } else {
                newgenes[i] = parentB.genes[i];
            }
        }
        return new DNA(newgenes);
    };
    this.crossover2 = function(parentB){
        var newgenes = [];
        for(var i = 0; i<this.genes.length; i++){
            if(random(1) < 0.5){
                newgenes[i] = this.genes[i];
            } else {
                newgenes[i] = parentB.genes[i];
            }
        }
        return new DNA(newgenes);
    };
    this.mutation = function(mutationRate){
        for(var i = 0; i<this.genes.length; i++){
            if(random(1)< mutationRate){
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(0.1);
            }
        }
    }
}
function Rocket(childDna, color){
    this.pos = createVector(width/2, height*0.8);
    this.height = 5;
    this.width = 25;
    this.vel = createVector();
    this.acc = createVector(0);
    this.fitness = 0;
    this.hitWall = false;
    this.hitTarget = -1;                //frame in which the rocket hit the target, -1 if never hits.
    if(childDna){
        this.dna = childDna;
    } else {
        this.dna = new DNA();
    }
    if(color){
        this.color = color;
    } else
        this.color = [floor(random(256)), floor(random(256)), floor(random(256))]


    this.applyForce = function(force){
        this.acc.add(force);
    };
    this.outOfWindow = function () {
        return this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height;
    };
    this.hitWalls = function () {
        //checks the rocket against all walls
        for(var i = 0; i<walls.length; i++){
            if(walls[i].hit(this))
                return true;
        }
        return false;
    };
    this.update = function(){

        if(target.hit(this)) {
            this.hitTarget = count;
            return false;
        } else if(this.outOfWindow() || this.hitWalls()){
            this.hitWall = true;
            return false;
        } else {
            this.applyForce(this.dna.genes[count]);
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            return true;
        }
    };
    this.show = function(){
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();
        rotate(this.vel.heading());
        rectMode(CENTER);
        fill(this.color[0], this.color[1], this.color[2], 70);
        rect(0, 0, this.width,this.height);
        pop();
    };

    this.calcFitness = function(){
        var d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
        this.fitness = map(d, 0, sqrt(height*height+width*width), 100, 0);
        if(this.hitTarget !== -1)
            this.fitness *= 5*(1+(lifespan-this.hitTarget)/lifespan);
        else if (this.hitWall)
            this.fitness/=1.5;
        //this.fitness = 1/d;
    };

    this.getVertexes = function(){
        var vertexes = [];
        //initialize vertexes as if they were around 0.0 for rotation
        vertexes[0] = createVector(-1* this.width/2,-1* this.height/2);
        vertexes[1] = createVector(this.width/2,-1*this.height/2);
        vertexes[2] = createVector(this.width/2, this.height/2);
        vertexes[3] = createVector(-1* this.width/2,this.height/2);

        var angle = atan2(this.vel.y, this.vel.x);
        var s = sin(angle);
        var c = cos(angle);
        for(var v = 0; v<vertexes.length; v++){
            //compute rotated vertexes, move them into position.
            vertexes[v] = createVector(this.pos.x+vertexes[v].x*c - vertexes[v].y*s,this.pos.y + vertexes[v].x*s + vertexes[v].y*c);
        }
        fill(255, 255,255, 50);

        return vertexes;
    }
}

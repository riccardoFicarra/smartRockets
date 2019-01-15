var population;
var lifespan = 1000;
var count = 0;
var target;
var alive = true;
function setup(){
    createCanvas(800,600);
    population = new Population();
    target = new Target();
}
function draw(){
    background(0);
    alive = population.update();
    population.show();

    if(count === lifespan || !alive){
        count = 0;
        //population = new Population();
        population.evaluate();
        population.selection();
        alive = true;
    }
    ellipse(target.pos.x, target.pos.y, target.r,target.r);
    count++;
}
function Target(){
    this.r = 32;
    this.pos = createVector(width/2, 50);
}
function Population(){
    this.rockets = [];
    this.popsize = 100;
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

        this.matingPool = [];
        for(i = 0; i<this.popsize; i++){
            var n = this.rockets[i].fitness*100;
            for(var j = 0; j<n; j++){
                this.matingPool.push(this.rockets[i]);
            }
        }


    };
    this.selection = function(){
        var newRockets = [];
        for(var i = 0; i<this.rockets.length; i++){
            var iA = floor(random(0, this.matingPool.length));
            var iB = floor(random(0, this.matingPool.length));
            var parentA = this.matingPool[iA].dna;
            var parentB = this.matingPool[iB].dna;
            var child = parentA.crossover(parentB);
            child.mutation();
            newRockets[i] = new Rocket(child);
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
    this.mutation = function(){
        var mutationRate = 0.05;
        for(var i = 0; i<this.genes.length; i++){
            if(random(1)< mutationRate){
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(0.1);
            }
        }
        }
}
function Rocket(childDna){
    this.pos = createVector(width/2, height*0.8);
    this.vel = createVector();
    this.acc = createVector(0);
    this.color = [255,0,0];
    this.fitness = 0;
    this.hitWall = false;
    this.hitTarget = -1;                //frame in which the rocket hit the target, -1 if never hits.
    if(childDna){
        this.dna = childDna;
    } else {
        this.dna = new DNA();
    }


    this.applyForce = function(force){
        this.acc.add(force);
    };
    this.outOfWindow = function () {
        return this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height;
    };
    this.update = function(){

        if(this.hit(target)) {
            this.hitTarget = count;
            return false;
        } else if(this.outOfWindow()){
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
        fill(this.color[0], this.color[1], this.color[2]);
        rect(0, 0, 25,5);
        pop();
    };
    this.calcFitness = function(){
        var d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
        this.fitness = map(d, 0, width, 100, 0);
        if(this.hitTarget !== -1)
            this.fitness += 1000-(lifespan-this.hitTarget)/lifespan*500;
        else if (this.hitWall)
            this.fitness -= 20;
        //this.fitness = 1/d;
    };
    this.hit = function(target){
        return dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y) < target.r;
    }
}
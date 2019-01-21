//play as much as you want with the following variables
var populationSize = 100;
//number of top k rockets that survive to next generation without changing
var elite = populationSize/10;
var lifespan = 500;
var speed = 0.3;
//number of squares in which the screen is divided
var granularity = 100;
//chance that a certain gene is changed to a random one
var mutationRate = 0.03;
//increase bias towards replicating best rockets
var poli_increase = 5;

//dont touch these others
var target;
var alive = true;
var walls = [];
var population;
var count = 0;
var generations = 0;
var maxFit = 0;
var oldMaxFit = 1;
var totFit = 0;
var avgFit = 1;
function setup(){
    collideDebug(true);
    createCanvas(800,800);
    population = new Population();
    target = new Target(width/2, 100, 32);
    walls.push(new Wall(width/2, 200, 100, 5));
    walls.push(new Wall(width/2-50, height/2+20, 5, 450));
    walls.push(new Wall(width/2+50, height/2+20, 5, 450));
    //walls[1] = new Wall(width-300, height/3, 600, 5);

    //walls[2] = new Wall(width/2-150, 0.3*height, 150, 5);
    //walls[3] = new Wall(width/2-100, 0.6*height, 500, 5);
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
    this.popsize = populationSize;

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
        maxFit = 0;
        totFit = 0;
        for(i = 0; i<this.popsize; i++){
            this.rockets[i].calcFitness();
            totFit += this.rockets[i].fitness;
            if(this.rockets[i].fitness > maxFit){
                maxFit = this.rockets[i].fitness;
            }
        }
        var maxIncrease = (maxFit-oldMaxFit)/oldMaxFit*100;
        oldMaxFit = maxFit;
        var avgIncrease = (totFit/populationSize-avgFit)/avgFit*100;
        avgFit = totFit/populationSize;
        console.log("maxFit ="+maxFit);
        console.log("max fitness increase: "+maxIncrease+"%");
        console.log("avg fitness = "+totFit/populationSize);
        console.log("avg fitness increase: "+avgIncrease+"%");
    };

    //if defined, parent skipChoice is never chosen (avoids having rockets with the same rocket as both parents)
     this.acceptReject = function(skipChoice, countChild) {
        var safety = 0;
        while(safety < 1000){
            var choice = floor(random(0,this.rockets.length));
            if(this.rockets[choice].fitness > random(maxFit) && (!skipChoice || skipChoice.inSameSquare(this.rockets[choice]))){
                countChild[choice]++;
                return this.rockets[choice];
            }
            safety++;
        }
        //in case the time limit is exceeded, just select the last one anyway
        return this.rockets[choice];
    };

    this.selection = function() {
        var newRockets = [];
        this.rockets.sort(function (a, b) {
            return b.fitness - a.fitness
        });

        this.findTopKRockets = function (k) {
            var topK = [];
            for (var i = 0; i < k; i++)
                topK[i] = this.rockets[i];
            return topK;
        };
        elite = floor(elite);
        if (elite !== 0) {
            var topKRockets = this.findTopKRockets(elite);
            for (var i = 0; i < elite; i++)
                newRockets[i] = new Rocket(topKRockets[i].dna, topKRockets[i].color);
        }
        var countChild = [];
        for(i = 0; i<populationSize; i++)
            countChild[i] = 0;
        for(i = elite; i<this.rockets.length; i++){
            var parentA = this.acceptReject(undefined, countChild);
            var parentB = this.acceptReject(undefined, countChild);
            var childDNA = parentA.dna.crossover(parentB.dna);
            childDNA.mutation(mutationRate);
            var childColor;
            if(parentA.fitness > parentB.fitness)
                childColor = parentA.color;
            else
                childColor = parentB.color;
            newRockets[i] = new Rocket(childDNA, childColor);
        }
        console.log(countChild);
        this.rockets = newRockets;
    }


}
function DNA(genes){
    this.genes = [];
    if(genes){
        this.genes = genes;
    } else {
        for(var i = 0; i<granularity*granularity; i++){
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(speed);
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
        var mut = 0;
        for(var i = 0; i<this.genes.length; i++){
            if(random(1)< mutationRate){
                mut++;
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(speed);
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

    this.inSameSquare = function(other){
        return this.getGridY() === other.getGridY() && this.getGridX() === other.getGridX();
    };
    this.getGridX = function(){
        return floor(this.pos.x/(width/granularity));
    };
    this.getGridY = function(){
        return floor(this.pos.y/(height/granularity));
    };
    this.applyForce = function(){
        this.acc = this.dna.genes[this.getGridY()*granularity+this.getGridX()];
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
            this.applyForce();
            this.vel.add(this.acc);
            this.pos.add(this.vel);
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
            this.fitness *= 2*(1+(lifespan-this.hitTarget)/lifespan);
        //else if (this.hitWall)
          //  this.fitness/=2;
        //this.fitness = 1/d;
        //this.fitness = pow(2, this.fitness);
        this.fitness = pow(this.fitness,poli_increase);
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

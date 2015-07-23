var model = {};
var hubRouterIconW = 30, popPadding = 10;
var cloudIconW = 75, branchIconW = 50;
model.svg = {W:800, H:500};
model.pops={};
model.pops.count = 3;
model.pops.loci = [];
model.pops.popDimensions=[];
model.pops.hubRouterCount = [4,2,3,2];
model.clouds={};
model.clouds.count = 2;
model.clouds.loci = [];
model.clouds.cloudDimensions = [];
model.branches={};
model.branches.count = 2;
model.branches.loci = [];
model.branches.branchDimensions = [];

var fill = d3.scale.category10();

var nodes = [],
		links = [],
		foci = [{x: 150, y: 150}, {x: 150, y: 400}, {x: 150, y: 550}];

var svg = d3.select("#fs-layout").append("svg")
		.attr("width", model.svg.W)
		.attr("height", model.svg.H);

var force = d3.layout.force()
		.nodes(nodes)
		.links(links)
		.linkDistance(function(d,i){
			var xDist = d.source.x - d.target.x,
					yDist = d.source.y - d.target.y;
					var l = Math.sqrt(xDist*xDist + yDist*yDist);
					return Math.floor(l);
		})
		.gravity(0)
		.charge(-30)
		.size([model.svg.W, model.svg.H])
		.on("tick", tick);

var node = svg.selectAll("image");
var link = svg.selectAll(".link");
var imageURL = ["img/router.svg", "img/cloud.svg", "img/branch.svg"];

function tick(e) {

	link.attr("x1", function(d) { return (d.source.x + d.source.w/2); })
	    .attr("y1", function(d) { return (d.source.y + d.source.h/2); })
	    .attr("x2", function(d) { return (d.target.x + d.target.w/2); })
	    .attr("y2", function(d) { return (d.target.y + d.target.h/2); });
	
	var k = .1 * e.alpha;
	// Push nodes toward their designated focus.
	nodes.forEach(function(o, i) {
		var locus = getNodeLocus(o.level, o.column, o.order);
		o.y += (locus.Y - o.y) * k;
		o.x += (locus.X - o.x) * k;
	});

	node
	.attr("x", function(d) { return d.x; })
	.attr("y", function(d) { return d.y; });
}

function getNodeLocus(level, column, order){
	var calcLocus = {};
	switch(level){
		case 0:
			var locus = model.pops.loci[column];
			var hubRouterCount = model.pops.hubRouterCount[column];
			var pop = model.pops.popDimensions[column];
			calcLocus={
				X: (locus.X - pop.W/2) + (((pop.W-popPadding*2)/hubRouterCount)*(0.5+order)) + popPadding - hubRouterIconW/2,
				Y: locus.Y
			};
			break;
		case 1:
			var locus = model.clouds.loci[column];
			calcLocus={
				X: locus.X,
				Y: locus.Y
			};
			break;
		case 2:
			var locus = model.branches.loci[column];
			calcLocus={
				X: locus.X,
				Y: locus.Y
			};
			break;
		default:
			break;
	}
	return calcLocus;
}

function addAllPops(){
	var level = 0;
	model.pops.count = document.getElementById("q0").value;
	setLociPops(model.pops.count, level);
	setPopDimensions();
	for (var i=0; i<model.pops.count; i++){
		addPop(i);
	}
}

function addPop(index){
	var popDimensions = model.pops.popDimensions[index];
	svg.append("rect")
	.attr("x", popDimensions.X)
	.attr("y", popDimensions.Y)
	.attr("width", popDimensions.W)
	.attr("height", popDimensions.H)
	.style("fill", "rgba(240, 248, 255, 0.16)")
	.style("stroke", "rgba(223, 240, 255, 0.15)")
	.style("stroke-width", "10")
	.style("stroke-linejoin", "round");
} 

function setPopDimensions(){
	for (var i=0; i<model.pops.count; i++){
		var popCount = model.pops.count;
		var paddingX = 10, paddingY = 10;
		var popX, popY, popW, popH;
		var maxW = 220, maxH = 150;
		var locus = model.pops.loci[i];
		popW = (model.svg.W/popCount) - 2*paddingX;
		popW = popW>maxW?maxW:popW;
		popH = 100;
		popX = locus.X - popW/2;
		popY = locus.Y - popH/2;
		model.pops.popDimensions[i] = ({X:popX, Y:popY, W:popW, H:popH});
	}
}

function setLociPops(count, level){
	for(var i=0; i<count; i++){
		var columnW = model.svg.W/count;
		var rowH = (model.svg.H/3);
		model.pops.loci[i] = {
			X: (i*columnW)+(columnW/2),
			Y: (rowH/2) + (level*rowH)
		}
	}
}

function addAllHubs(){
	var csvString = document.getElementById("q1").value;
	var split = csvString.split(",");
	for(var k=0; k<split.length; k++){
		model.pops.hubRouterCount[k] = parseInt(split[k],10);
		for(var i=0; i<model.pops.hubRouterCount[k]; i++){
			addHub(k, i);
		}
	}
}

function addHub(popIndex, order){
	nodes.push({level: 0, column:popIndex, order:order, w:hubRouterIconW, h:hubRouterIconW});
	force.start();
	node = node.data(nodes);

	node.enter().append("image")
			.attr("xlink:href", function(d){return imageURL[0]})
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
			.attr("width", hubRouterIconW)
			.attr("height", hubRouterIconW)
			.on("dblclick", nodeClick)
			.call(force.drag);
}

function addAllClouds(){
	var level = 1;
	var cloudCount = model.clouds.count = parseInt(document.getElementById("q2").value, 10); //order
	setLociClouds(model.clouds.count, level); //One column
	setCloudDimensions();
	for(var i=0; i<cloudCount; i++){
		addCloud(i);
	}
}

function addCloud(column){
	var cloudDimensions = model.clouds.cloudDimensions[column];
	nodes.push({level: 1, column:column, order:0, w:cloudIconW, h:cloudIconW});
	force.start();
	node = node.data(nodes);

	node.enter().append("image")
			.attr("xlink:href", function(d){return imageURL[1]})
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
			.attr("width", cloudIconW)
			.attr("height", cloudIconW)
			.on("dblclick", nodeClick)
			.call(force.drag);
}

function setLociClouds(count, level){
	for(var i=0; i<count; i++){
		var columnW = model.svg.W/count;
		var rowH = (model.svg.H/3);
		model.clouds.loci[i] = {
			X: (i*columnW)+(columnW/2),
			Y: (rowH/2) + (level*rowH)
		}
	}
}

function setCloudDimensions(){
	for (var i=0; i<model.clouds.count; i++){
		var cloudX, cloudY;
		var locus = model.clouds.loci[i];
		cloudX = locus.X - cloudIconW/2;
		cloudY = locus.Y - cloudIconW/2;
		model.clouds.cloudDimensions[i] = ({X:cloudX, Y:cloudY});
	}
}

function addAllBranches(){
	var level = 2;
	var branchCount = model.branches.count = parseInt(document.getElementById("q3").value, 10); //order
	setLociBranches(model.branches.count, level); //One column
	setBranchDimensions();
	for(var i=0; i<branchCount; i++){
		addBranch(i);
	}
}

function addBranch(column){
	var branchDimensions = model.branches.branchDimensions[column];
	nodes.push({level: 2, column:column, order:0, w:branchIconW, h:branchIconW});
	force.start();
	node = node.data(nodes);

	node.enter().append("image")
			.attr("xlink:href", function(d){return imageURL[2]})
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
			.attr("width", branchIconW)
			.attr("height", branchIconW)
			.on("dblclick", nodeClick)
			.call(force.drag);
}

function setLociBranches(count, level){
	for(var i=0; i<count; i++){
		var columnW = model.svg.W/count;
		var rowH = (model.svg.H/3);
		model.branches.loci[i] = {
			X: (i*columnW)+(columnW/2),
			Y: (rowH/2) + (level*rowH)
		}
	}
}

function setBranchDimensions(){
	for (var i=0; i<model.branches.count; i++){
		var branchX, branchY;
		var locus = model.branches.loci[i];
		branchX = locus.X - branchIconW/2;
		branchY = locus.Y - branchIconW/2;
		model.branches.branchDimensions[i] = ({X:branchX, Y:branchY});
	}
}

function addLink(s, d){
	links.push({"source":  s, "target":  d});
	force.start();
	link = link.data(links);

  link.enter().insert("line", "image")
    .attr("class", "link")
    .style("stroke", "rgba(0, 0, 0, 0.16)")
    .style("stroke-width", "3")
    .attr("x1", function(d) { return (d.source.x + d.source.w/2); })
    .attr("y1", function(d) { return (d.source.y + d.source.h/2); })
    .attr("x2", function(d) { return (d.target.x + d.target.w/2); })
    .attr("y2", function(d) { return (d.target.y + d.target.h/2); });
}

var source = null;
var destination = null;

function nodeClick(d){
	if(!source){
		source = d;
	}
	else{
		destination = d;
	}
	
	if(source && destination){
		addLink(source, destination);
		source = destination = null;
	}
}

function calculateCenter(x, w){
	var center = x + w/2;
	return center;
}



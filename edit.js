//Various accessors that specify the four dimensions of that data visulize.
function x(d){
  if (d.avg_income == 0){
  	return 10000;
  }
  
  else{
  	return d.avg_income;  	
  }
}

function y(d){
  return d.city_total;
}

function radius(d){
  return d.number_per_city * 1000;
}

function color(d){
  for (var i = 0; i < d.hashtag.length; i++){
     if (d.hashtag[i] == "BlackLivesMatter")//{
	  return 1;
     //}
     else if (d.hashtag[i] == "RiseUpOctober")//{
	  return 2;
    // }
     else if (d.hashtag[i] == "PoliceBrutality")//{
     	  return 3;
    // }
     else
	  return 4;	
     //}
  }
}

function key(d) {
  return d.user_city_name;
}


// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;


// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.log().domain([10000, 150000]).range([0, width]),
    yScale = d3.scale.linear().domain([0, 200]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e5]).range([0, 40]),
    colorScale = d3.scale.category10();


// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");
    
    
// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
    
    
// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);
    

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("Average Income"); 
    
// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Number of Tweets"); 

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(22);


// Load the data.
d3.json("data_updated.json", function(data) {
  
  // A bisector since many nation's data is sparsely-defined.
  var bisect = d3.bisector(function(d) { return d[0]; });
  
  
  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(interpolateData(22))
    .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position)
      .sort(order);
      
      
  // Add a title.
  dot.append("title")
      .text(function(d) { return d.name; });
      
      
  // Add an overlay for the year label.
  var box = label.node().getBBox();
  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", enableInteraction);
        
        
  // Start a transition that interpolates the data based on year.
  svg.transition()
      .duration(30000)
      .ease("linear")
      .tween("year", tweenYear)
      .each("end", enableInteraction);
      
      
  // Positions the dots based on data.
  function position(dot) {
    dot .attr("cx", function(d) { return xScale(x(d)); })
        .attr("cy", function(d) { return yScale(y(d)); })
        .attr("r", function(d) { return radiusScale(radius(d)); });
  }
  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }
  
  // After the transition finishes, you can mouseover to change the year.
  function enableInteraction() {
    var yearScale = d3.scale.linear()
        .domain([22, 26])
        .range([box.x + 1, box.x + box.width - 1])
        .clamp(true);
        
        
    // Cancel the current transition, if any.
    svg.transition().duration(0);
    overlay
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove);
    function mouseover() {
      label.classed("active", true);
    }
    function mouseout() {
      label.classed("active", false);
    }
    function mousemove() {
      displayYear(Math.round(yearScale.invert(d3.mouse(this)[0])));
    }
  }
  // Tweens the entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label are redrawn.
  function tweenYear() {
    var year = d3.interpolateNumber(22, 26);
    return function(t) { displayYear(Math.round(year(t))); };
  }
  // Updates the display to show the specified year.
  function displayYear(year) {
    svg.selectAll(".dot").remove();
	var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(interpolateData(year))
    .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position)
      .sort(order);
   // svg.selectAll(".dot").data(interpolateData(year), key).call(position).sort(order);
    label.text(Math.round(year));
  }
  
  
 
  // Interpolates the dataset for the given (fractional) year.
  function interpolateData(year) {
    return data.map(function(d) {
      return {
        name: d.user_city_name,  
        hashtag: d.hashtags,
        year: d.created_at,
	//	number: interpolateValues(d.number_per_city, year),
	avg_income: interpolateValues(d.avg_income, d.created_at, year),
	city_total: interpolateValues(d.city_total, d.created_at, year),
	number_per_city: interpolateValues(d.number_per_city, d.created_at, year)
      };
    });
  }
  
  
  // Finds (and possibly interpolates) the value for the specified year.
  function interpolateValues(value, date, year) {
	if (year == date)
	{
	//console.log(year + ":" + date);
	return value;
	}
	else
	   return 0;
  }
});






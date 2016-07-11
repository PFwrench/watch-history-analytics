function loadVisuals (categories) {

	console.log(categories);

	var maxCategories = 0;
	for (var i = 0; i < categories.length; i++) {
		if (categories[i].count > maxCategories) {
			maxCategories = categories[i].count;
		}
	};

	
	$('#category-graph').html("<svg id='category-graph-svg'></svg>");

	map = d3.select('svg');
    var widthStart = $('svg').width();
    var heightStart = $('svg').height();

    draw(widthStart, heightStart);

	function draw (width, height) {

		var x = d3.scale.linear()
					    .domain([0,categories.length])
					    .range([0,width]);

		var y = d3.scale.linear()
						.domain([0, maxCategories])
    					.range([height, 30]);

        var color = d3.scale.linear()
                            .domain([0, maxCategories])
                            .range(['yellow', 'red']);


    	var chart = d3.select('#category-graph-svg');

    	var barWidth = width / categories.length;

    	var bar = chart.selectAll("g")
      				   .data(categories)
    				   .enter().append("g")
      				   .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });

      	bar.append("rect")
      	   .attr("y", function(d) { return y(d.count); })
      	   .attr("height", function(d) { return height - 32 - y(d.count); })
      	   .attr("width", barWidth - 1)
           .style('fill', function (d) { return color(d.count)});

        function wrap() {
            var self = d3.select(this),
            textLength = self.node().getComputedTextLength(),
            text = self.text();

            while (textLength > (barWidth - 2) && text.length > 0) {
                text = text.slice(0, -1);
                self.text(text + '...');
                textLength = self.node().getComputedTextLength();
            }
        } 

      	bar.append("text")
     	   .attr('y', height - 20)
     	   .attr('text-anchor', 'middle')
     	   .attr('dx', barWidth/2)
           .append('tspan')
           .text(function(d) { return d.name; })
           .each(wrap); 

      	bar.append("text")
     	   .attr('y', function(d) { return y(d.count) - 2; })
     	   .attr('text-anchor', 'middle')
     	   .attr('dx', barWidth/2)
           .text(function(d) { return d.count; });

	}
	$(window).on('resize', function () {
		$('svg').html('');
		draw($('svg').width(),$('svg').height())
	});
}



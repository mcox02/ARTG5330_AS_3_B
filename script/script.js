//Assignment 3
//Due Thursday March 26

var margin = {t:100,r:100,b:200,l:150},
    width = $('.canvas').width() - margin.l - margin.r,
    height = $('.canvas').height() - margin.t - margin.b;


//Set up SVG drawing elements -- already done
var svg = d3.select('.canvas')
    .append('svg')
    .attr('width', width + margin.l + margin.r)
    .attr('height', height + margin.t + margin.b)
    .append('g')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//Scales
var scales = {};
    scales.x = d3.scale.log().range([0,width]);
    scales.y = d3.scale.linear().range([height,0]);

var scaleColor = d3.scale.ordinal()
            .range([
                'white','blue','orange','red','yeallow',
                'green','teal','gray'])
        
            .domain([   "North America",
                "Europe & Central Asia",
                "East Asia & Pacific",
                "Latin America & Caribbean",
                "Middle East & North Africa",
                "South Asia",
                "Sub-Saharan Africa",
                "undefined"
                ]);


//Global variables
var yVariable = "CO2 emissions (kt)",
    y0 = 1990,
    y1 = 2013;


//d3.map for metadata
var metaDataMap = d3.map();

//TODO: create a layout function for a treemap
var treemap = d3.layout.treemap()
    .children(function(d){
        return d.values;
    })
    .value(function(d){
        return d.data.get(y0);
    })
    .size([width,height])
    .sticky(true)
    .padding([2,2,2,2]);



//START!
queue()
    .defer(d3.csv, "data/00fe9052-8118-4003-b5c3-ce49dd36eac1_Data.csv",parse)
    .defer(d3.csv, "data/metadata.csv", parseMetaData)
    .await(dataLoaded);

function dataLoaded(err, rows, metadata){

    //First, combine "rows" and "metadata", so that each country is assigned to a region
        rows.forEach(function(row){
            row.Region = metaDataMap.get(row.key);
        });
    //Then create hierarchy based on regions, using d3.nest()
        var data = d3.nest()
            .key(function(d){
                return d.Region;
            })
            .entries(rows);
        //Finally, perform a treemap layout on the data
    treemap
        .value(function(d){
            return d.data.get(y0);
        });
console.log(data);

        var root = {
            key: 'region',
            values: data
        };

console.log(root);
    draw(root);
}

function draw(root){
    //Append <rect> element for each node in the treemap
    var nodes = svg.selectAll('.node')
        .data(treemap(root), function(d){return d.key;})
         .classed('leaf',function(d){
            return !(d.children);
        });

    var nodesEnter = nodes
        .enter()
        .append('g')
        .attr('class',"node")
        .attr('transform',function(d){
            return "translate("+d.x+','+d.y+')';
        });
    nodesEnter
        .append('rect')
        .attr('width',function(d){return d.dx; })
        .attr('height',function(d){return d.dy;})
        .style('fill-opacity',function(d){ return .75-d.depth/8})
        .style('fill', function(d){
            var continent = metaDataMap.get(d.key)

            return scaleColor(continent);
        })
        .style('stroke','black')        
        .style('stroke-width','.25px');

    //Also append <text> label for each tree node that is a leaf
    nodesEnter
        .each(function(d){
            if((d.dx > 50) && (!d.children)){
                d3.select(this).append('text')
                    .text(d.key)
                    .attr('dx', d.dx/2)
                    .attr('dy', d.dy/2)
                    .attr('text-anchor','middle')
                    .style('font-size','50%');
            }
        });

}

function parse(d){
    var newRow = {
        key: d["Country Name"],
        series: d["Series Name"],
        data:d3.map()
    };
    for(var i=1990; i<=2013; i++){
        var heading = i + " [YR" + i + "]";
        newRow.data.set(
            i,
            (d[heading]=="..")?0:+d[heading]
        );
    }

    return newRow;
}

function parseMetaData(d){
    var countryName = d["Table Name"];
    var region = d["Region"];
    metaDataMap.set(countryName, region);
}
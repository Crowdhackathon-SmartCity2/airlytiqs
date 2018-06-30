flatpickr("#datepicker", {
	defaultDate: 'today',
	maxDate: 'today',
	inline: 'true',
	locale:{
		"firstDayOfWeek": 1
	},
	onChange: function(selectedDates, dateStr, instance){
		randomizeHeatmap();
	}
});
let heatmapLayers = [];
let activeLayer, activeStamenLayer;
let colors = {
	'Dust': ['Black', 'DarkRed', 'Yellow', 'White'],
	'UV/IR': ['Black', 'Purple', 'Red', 'Yellow', 'White'],
	'CO': ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
	'CO2': ['blue', 'red']
};
let stamenLayersForTimeOfTheDay = {
	'default': 'toner-lite',
	'Morning': 'toner-lite',
	'Noon': 'toner-lite',
	'Evening': 'toner',
	'Night': 'toner'
};

const defaultMapCenter = { lon: 37.9553645, lat: 23.7401097};
const osmLayer = new ol.layer.Tile({
	source: new ol.source.OSM()
});

const raster = new ol.layer.Tile({
	source: new ol.source.Stamen ({
		layer: stamenLayersForTimeOfTheDay.default
	}),
	name: 'base layer'
});


const map = new ol.Map({
	layers: [raster],
	target: "mapWrapper",
	view: new ol.View({
		center: ol.proj.transform([ defaultMapCenter.lat, defaultMapCenter.lon ], 'EPSG:4326', 'EPSG:3857'),
		zoom: 13
	})
});

renderLayer('CO');

function simulate(){
	return setInterval(function(){
		randomizeHeatmap();
	}, 500);
}

function randomizeHeatmap(){
	delete heatmapLayers[activeLayer];
	renderLayer(activeLayer);
}

function createDummyData(){
	var data = new ol.source.Vector();
	let temp;

	for(point of route){
		temp = featureFromLonLat(point.lat, point.lon, getRandomFloat());
		data.addFeature(temp);
	}

	return data;
}

function featureFromLonLat(lon, lat, weight) {
	const proj = ol.proj.fromLonLat([lon, lat]);
	const point = new ol.geom.Point(proj);
	return pointFeature = new ol.Feature({
		geometry: point,
		weight: weight
	});
}

function getRandomFloat() {
	const min = 0;
	const max = 0.45;
	return Math.random() * (max - min) + min;
	// return .25
}

document.querySelector('#layer').addEventListener('change', function(e){
	const layer = e.target.options[e.target.selectedIndex].value;
	if( layer!==activeLayer ){
		renderLayer(layer);
		randomizeHeatmap();
	}
});

document.querySelector('#timeRange').addEventListener('change', function(e){
	const timeOfTheDay = e.target.options[e.target.selectedIndex].value;
	const newStamenLayer = stamenLayersForTimeOfTheDay[timeOfTheDay] || stamenLayersForTimeOfTheDay.default;
	updateStamenLayer(newStamenLayer);
	randomizeHeatmap();
});

function updateStamenLayer(stamenLayer){
	if(stamenLayer!==activeStamenLayer){
		map.getLayers().array_[0].setSource(new ol.source.Stamen ({
			layer: stamenLayer
		}));
		activeStamenLayer = stamenLayer;
	}
}

function renderLayer(layer){
	createLayerIfNeeded(layer);
	removeActiveHeatmapLayer();
	addLayer(layer);
	activeLayer = layer;
}

function createLayerIfNeeded(layer){
	if(typeof heatmapLayers[layer]=='undefined'){
		heatmapLayers[layer] = createLayer(layer);
	}
}

function removeActiveHeatmapLayer(){
	map.removeLayer(map.getLayers().array_[1]);
}

function addLayer(layer){
	map.addLayer(heatmapLayers[layer]);
}

function createLayer(layer){
	return new ol.layer.Heatmap({
		name: layer,
		source: createDummyData(),
		radius: 50,
		blur: 10,
		opacity: 1,
		maxResolution: 50,
		gradient: colors[layer]
	});
}

// debug
let simulating = false;
let simId;
document.body.onkeyup = function (e) {
	if(e.which===16){
		if(simulating){
			clearInterval(simId);
		} else {
			simId = simulate();
		}
		simulating = !simulating;
	}
}

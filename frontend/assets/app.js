let heatmapLayers = [];
const initialHeatmapLayer = 'co';
let activeHeatmapLayer, activeStamenLayer;
let stamenLayersForTimeOfTheDay = {
	'default': 'toner-lite',
	'Morning': 'toner-lite',
	'Noon': 'toner-lite',
	'Evening': 'toner',
	'Night': 'toner'
};
let colors = {
	'dust': ['Black', 'DarkRed', 'Yellow', 'White'],
	'uv': ['Black', 'Purple', 'Red', 'Yellow', 'White'],
	'co': ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
	'co2': ['blue', 'red']
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

function renderHeatmapLayer(layerName){
	createLayerIfNeeded(layerName);
	removeActiveHeatmapLayer();
	map.addLayer(heatmapLayers[layerName]);
	activeHeatmapLayer = layerName;
}

function createLayerIfNeeded(layerName){
	if(typeof heatmapLayers[layerName]=='undefined'){
		heatmapLayers[layerName] = createLayer(layerName);
	}
}

function getData(layerName){
	let data = new ol.source.Vector();
	let temp;
	for(point of route[layerName]){
		temp = featureFromLonLat(point.lat, point.lon, point.w);
		data.addFeature(temp);
	}

	return data;
}

function createLayer(layerName){
	return new ol.layer.Heatmap({
		name: layerName,
		source: getData(layerName),
		radius: 30,
		blur: 10,
		opacity: 1,
		maxResolution: 50,
		gradient: colors[layerName]
	});
}

function featureFromLonLat(lon, lat, weight) {
	const proj = ol.proj.fromLonLat([lon, lat]);
	const point = new ol.geom.Point(proj);
	return pointFeature = new ol.Feature({
		geometry: point,
		weight: weight
	});
}

function removeActiveHeatmapLayer(){
	map.removeLayer(map.getLayers().array_[1]);
}

function updateStamenLayer(stamenLayer){
	if(stamenLayer!==activeStamenLayer){
		map.getLayers().array_[0].setSource(new ol.source.Stamen ({
			layer: stamenLayer
		}));
		activeStamenLayer = stamenLayer;
	}
}

function initDatepicker(){
	flatpickr("#datepicker", {
		defaultDate: 'today',
		maxDate: 'today',
		inline: 'true',
		locale:{
			"firstDayOfWeek": 1
		},
		onChange: function(selectedDates, dateStr, instance){
			// update heatmap
		}
	});
}

function addEventListeners(){
	document.querySelector('#layer').addEventListener('change', function(e){
		const layerName = e.target.options[e.target.selectedIndex].value;
		if( layerName!==activeHeatmapLayer ){
			renderHeatmapLayer(layerName);
		}
	});

	document.querySelector('#timeRange').addEventListener('change', function(e){
		const timeOfTheDay = e.target.options[e.target.selectedIndex].value;
		const newStamenLayer = stamenLayersForTimeOfTheDay[timeOfTheDay] || stamenLayersForTimeOfTheDay.default;
		updateStamenLayer(newStamenLayer);
	});
}

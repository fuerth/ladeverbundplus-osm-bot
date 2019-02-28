const fs = require('fs');
const path = require('path');

const getStations = require('./ladeverbundplus');

const OUTPUT_OSM = path.resolve(__dirname, '../data/osm_data.json');

// see https://stackoverflow.com/a/38340730/722162
const removeEmpty = (obj) => {
	Object.keys(obj).forEach(key => {
		if (obj[key] && typeof obj[key] === 'object') removeEmpty(obj[key]);
		else if (obj[key] == null) delete obj[key];
	});
	return obj;
};

function getSocketsByType(connections, type = 0) {
	const count = connections
		.map(c => Number(c))
		.reduce((acc, cur) => ((cur == type) ? acc + 1 : acc), 0);
	return `${count}`;
}

function genOSMNodes(stations) {
	return stations.map((p) => {
		return removeEmpty({
			"type": "node",
			"lat": p.latitude,
			"lon": p.longitude,
			"tags": {
				"amenity": "charging_station",
				"name": p.title,
				"description": p.locationNote ? p.locationNote.replace(/"/g, '') : null,

				"addr:city": p.city,
				"addr:postcode": p.zip,
				"addr:street": p.address,

				"bicycle": p.bikeAllowed ? "yes" : "no",
				"truck": p.carAllowed ? "yes" : "no",
				"car": p.carAllowed ? "yes" : "no",
				
				"fee": p.rateTitle === 'kostenlos' ? "no" : null,
				//TODO: "capacity": p.connectionList ? `${p.connectionList.split(',').length}` : null,
				//TODO: "socket:schuko": p.connectionList ?  getSocketsByType(p.connectionList.split(',')) : null,
				"socket:bikeenergy": p.connectionList ? getSocketsByType(p.connectionList.split(','), 4) : null,
				
				"operator": p.operator,
				"opening_hours": p.allday ? "24/7" : (p.openingtimes ? openingtimes : null),
				"website": p.operatorInternet ? decodeURIComponent(p.operatorInternet).replace(/.*href="(.*?)".*/, '$1') : null,

				"network": "Ladeverbund+",
				"network:website": "https://www.ladeverbundplus.de",
				"network:uuid": p.uid,

				"note": "Dieser Knoten wird automatisch aus Daten des Ladeverbund+ aktualisiert.",
			}
		});
	});
}

(async () => {
	var stations;
	stations = await getStations();
	const osmNodes = genOSMNodes(stations);
	
	fs.writeFile(OUTPUT_OSM, JSON.stringify(osmNodes, null, '\t'), function(err) {
		if (err) return console.error(err);
		console.log(`Wrote OSM-data to ${OUTPUT_OSM}`);
	});
})();


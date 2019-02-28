const https = require('https');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

//const LOCAL_FILE = './ladeverbundplus_data.js';
const LOCAL_FILE = path.resolve(__dirname, '../data', 'ladeverbundplus_data.json');
const REMOTE_FILE = 'https://www.ladeverbundplus.de/ladesaeulenfinder/e-bikes/data.js?tx_gmap_gmap%5Bmap%5D=2&tx_gmap_gmap%5Bcontroller%5D=Marker';
const MAX_AGE_TIME = 60*60*1000; //1 hour in ms

async function readLocalData() {
	return new Promise((resolve, reject) => {
		try {
			fs.readFile(LOCAL_FILE, 'utf8', function (err, data) {
				if (err) return reject(err);
				data = JSON.parse(data);
				resolve(data);
			});
		} catch (err) {
			reject(err);
		}
	});
}


async function getRemoteData() {
	var data = '';
	return new Promise((resolve, reject) => {
		https.get(REMOTE_FILE, function (res) {
			res.on('data', script => data += script);
			res.on('end', function () {
				var sandbox = {};
				vm.runInNewContext(data, sandbox);
				resolve(sandbox.data);
			});
			res.on('error', function (err) {
				reject(err);
			});
		});
	});
}


async function saveStationData(data) {
	data.lastUpdate = new Date();
	return new Promise((resolve, reject) => {
		fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, '\t'), function(err) {
			if (err) reject(err);
			resolve(data);
		});
	});
}


module.exports = async function getStations() {
	var data;
	try {
		data = await readLocalData();
	} catch(err) {
		data = null;
	}

	var needsUpdate = false;
	if (data && data.lastUpdate) {
		const lastUpdate = new Date(data.lastUpdate);
		const today = new Date();
		needsUpdate = (today - lastUpdate) > MAX_AGE_TIME
	}

	if (!data || needsUpdate) {
		try {
			data = await getRemoteData();
			data = await saveStationData(data);
		} catch(err) {
			throw new Error('Could not load station data: ', err);
		}
	}

	return data.points || [];
}
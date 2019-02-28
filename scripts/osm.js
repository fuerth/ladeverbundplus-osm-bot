const fs = require('fs');
const path = require('path');
const util = require('util');

const overpassData = require(path.resolve(__dirname, '../data/overpass.json'));

const elements = overpassData.elements;

var tagCollection = {}

elements.forEach(node => {
	Object.keys(node.tags).forEach(tag => {
		if (!(tag in tagCollection)) tagCollection[tag] = new Set();
		tagCollection[tag].add(node.tags[tag]);
	});
});

fs.writeFile('osmTags.json', JSON.stringify(tagCollection, null, '\t'), 'utf8', () => {
	console.log("Done");
});
//console.log(util.inspect(tagCollection, false, 2, true));

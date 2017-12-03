/* ========  Model ======= */

// Initial data to load points on our map
var initialLocations = [
	{name: 'Haystack Rock', location: {lat: 45.8841394, lng: -123.9708112}},
   	{name: 'Mo\'s', location: {lat: 45.872165, lng: -123.961685}},
   	{name: 'Tolovana Beach State Recreation Site', location: {lat: 45.872198, lng: -123.960845}},
   	{name: 'Pelican Brewing', location: {lat: 45.888162, lng: -123.961877}},
   	{name: 'Pig \'N Pancake', location: {lat: 45.895578, lng: -123.960909}},
   	{name: 'Stephanie Inn', location: {lat: 45.877142, lng: -123.961866}},
   	{name: 'Haystack Hill State Park', location: {lat: 45.883795, lng: -123.962038}},
   	{name: 'Hallmark Resort & Spa', location: {lat: 45.887527, lng: -123.963101}},
   	{name: 'The Wayfarer Restaurant', location: {lat: 45.889635, lng: -123.962954}},
   	{name: 'Bruce\'s Candy Kitchen', location: {lat: 45.899313, lng: -123.961188}},
   	{name: 'Mariner Market', location: {lat: 45.897265, lng: -123.960582}},
   	{name: 'Cannon Beach Clothing Company', location: {lat: 45.898179, lng: -123.961111}},
   	{name: 'Inn at Haystack Rock', location: {lat: 45.894322, lng: -123.961466}}
];


// Global infowindow
var infoWindow;

// Get the map initialized and loaded
var map;

function initMap() {

	// Create a styles array to use with the map
	// This style is called "Blue Essence" and is courtesy of Famous Labs via snazzymaps.com
	var styles = [
   	{
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#e0efef"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "hue": "#1900ff"
            },
            {
                "color": "#c0e8e8"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": 100
            },
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "lightness": 700
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#7dcdcd"
            }
        ]
	}];

	// Constructor creates a new map
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 45.886186, lng: -123.951382},
		styles: styles,
		mapTypeControl: false,
		zoom: 14
	});

	// Hook the bindings to the viewmodel
	ko.applyBindings(new ViewModel());
}

// Create the Location object - should hold all data relevant for one location
var Location = function(data) {

	var self = this;

	// Create a new google infowindow
	infoWindow = new google.maps.InfoWindow();

	this.name = data.name;
	this.lat = data.location.lat;
	this.lng = data.location.lng;
	this.visible = ko.observable(true);
	this.street = '';
	this.siteURL = '';
	this.street = '';
	this.city_st_zip = '';
	this.phone = '';

	// Set up for call to Foursquare
	var baseURL = 'https://api.foursquare.com/v2/venues/search?v=20161016&ll=';
	var clientID = '&client_id=BT4YQ5FM0WMMCHH2AO2IB5X3ZM4OPZCHFRM0GQOUBSTYDIVB';
	var clientSecret = '&client_secret=NZQOWNLCUVFVEBPFJQTBNNGA1H2DADMDO5ZUZVMXSITZEW2O';

	var foursquareURL = baseURL + this.lat + ',' + this.lng + clientID + clientSecret + '&intent=match&query=' + this.name;

	// Parse through what Foursquare has returned and store it for use
	$.getJSON(foursquareURL).done(function(json) {
		var results = json.response.venues[0];

		self.siteURL = results.url === undefined ? '' : results.url;
		self.street = results.location.formattedAddress[0] === undefined ? '' : results.location.formattedAddress[0];
		self.city_st_zip = results.location.formattedAddress[1] === undefined ? '' : results.location.formattedAddress[1];
		self.phone = results.contact.formattedPhone === undefined ? '' : results.contact.formattedPhone;

	}).fail(function() {
		// Throw an error message in case Foursquare isn't responding
		alert('Foursquare data could not be retrieved.');
	});


	// Create a Google maps marker for the location
	this.marker = new google.maps.Marker({
		position: new google.maps.LatLng(data.location),
		title: data.name,
		animation: google.maps.Animation.DROP,
		map: map
	});

	// Should I show the marker? Check the boolean visible to determine
	this.showMarker = ko.computed(function() {
		var result = this.visible() ? this.marker.setMap(map) : this.marker.setMap(null);
		return result;
	}, this);

	// Listen for the user to click on the marker, if they do display the infowindow with
	// Foursquare data
	this.marker.addListener('click', function() {

		self.innerHTML = '<div><strong>' + data.name + '</strong></div><br>' + '<div"><a href="' + self.siteURL + '">' + self.siteURL + '</a></div>' + '<div>' + self.street + '</div>' + '<div>' + self.city_st_zip + '</div>' + '<div>' + self.phone + '</div>';


		infoWindow.setContent(self.innerHTML);

		// Add bounce to the marker
		self.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
        	self.marker.setAnimation(null);
      	}, 2000);

		// Pan to the marker and open its information
		infoWindow.open(map, this);
		map.panTo(this.position);
	});

};



/* ========  ViewModel ======= */
var ViewModel = function() {
	var self = this;

	this.locations = ko.observableArray([]);
	this.searchQuery = ko.observable('');

	// Feed the data from our initial array into Location array
	initialLocations.forEach(function(locationItem){
		self.locations.push( new Location(locationItem) );
	});

	// Listen to see if the user clicks on a list item
	this.listClick = function() {
		google.maps.event.trigger(this.marker, 'click');
	};

	// If the user enters a search criteria, filter what's visible in the
	// list and markers
	this.filtered = ko.computed (function() {
		var filter = self.searchQuery().toLowerCase();
		if (!filter) {
			self.locations().forEach(function(locationItem) {
				locationItem.visible(true);
			});
		} else {
			return ko.utils.arrayFilter(self.locations(),
				function(locationItem) {
					var name = locationItem.name.toLowerCase();
					var result = (name.includes(filter));
					locationItem.visible(result);
					return result;
				});
			}
	});
};

// If the map can't be loaded, throw an error message
function googleError() {
	window.alert('The map could not be loaded.');
}
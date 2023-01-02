export const ROADMAP_BW_STYLE = new google.maps.StyledMapType(<any>[
    {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [{color: '#d3d3d3'}]
    },
    {
        featureType: 'transit',
        stylers: [{color: '#808080'}, {visibility: 'off'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{visibility: 'on'}, {color: '#b3b3b3'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'road.local',
        elementType: 'geometry.fill',
        stylers: [{visibility: 'on'}, {color: '#ffffff'}, {weight: 1.8}]
    },
    {
        featureType: 'road.local',
        elementType: 'geometry.stroke',
        stylers: [{color: '#d7d7d7'}]
    },
    {
        featureType: 'poi',
        elementType: 'geometry.fill',
        stylers: [{visibility: 'on'}, {color: '#ebebeb'}]
    },
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{color: '#a7a7a7'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry.fill',
        stylers: [{visibility: 'on'}, {color: '#efefef'}]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{color: '#696969'}]
    },
    {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'on'}, {color: '#737373'}]
    },
    {
        featureType: 'poi',
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.stroke',
        stylers: [{color: '#d6d6d6'}]
    },
    {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'on'}, {color: '#737373'}]
    },
    {
        featureType: 'poi',
        elementType: 'geometry.fill',
        stylers: [{color: '#dadada'}]
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'on'}, {color: '#737373'}]
    },
    {
        featureType: 'poi',
        elementType: 'geometry.stroke',
        stylers: [{visibility: 'on'}, {color: '#c1c1c1'}]
    },
    {
        featureType: 'all',
        elementType: 'geometry.stroke',
        stylers: [{visibility: 'on'}, {color: '#c1c1c1'}]
    }
]);

export const ROADMAP_POI_STYLE = new google.maps.StyledMapType([
    {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [{color: '#d3d3d3'}]
    },
    {
        featureType: 'transit',
        stylers: [{color: '#808080'}, {visibility: 'off'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{visibility: 'on'}, {color: '#b3b3b3'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'road.local',
        elementType: 'geometry.fill',
        stylers: [{visibility: 'on'}, {color: '#ffffff'}, {weight: 1.8}]
    },
    {
        featureType: 'road.local',
        elementType: 'geometry.stroke',
        stylers: [{color: '#d7d7d7'}]
    },
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{color: '#a7a7a7'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.fill',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry.fill',
        stylers: [{visibility: 'on'}, {color: '#efefef'}]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{color: '#696969'}]
    },
    {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'on'}, {color: '#737373'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'geometry.stroke',
        stylers: [{color: '#d6d6d6'}]
    },
    {
        featureType: 'poi',
        stylers: [{visibility: 'on'}]
    }
]);

export const SIMPLE_MAP_STYLE = new google.maps.StyledMapType([
    {
        elementType: 'geometry',
        stylers: [{color: '#d2e4c8'}]
    },
    {
        elementType: 'labels',
        stylers: [{visibility: 'off'}]
    },
    {
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
    },
    {
        elementType: 'labels.text.fill',
        stylers: [{color: '#616161'}]
    },
    {
        elementType: 'labels.text.stroke',
        stylers: [{color: '#f5f5f5'}]
    },
    {
        featureType: 'administrative',
        elementType: 'geometry',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [{color: '#bdbdbd'}]
    },
    {
        featureType: 'administrative.neighborhood',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'poi',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{color: '#eeeeee'}]
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{color: '#757575'}]
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{color: '#e5e5e5'}]
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9e9e9e'}]
    },
    {
        featureType: 'road',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{color: '#ffffff'}]
    },
    {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{color: '#757575'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{color: '#dadada'}]
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{color: '#616161'}]
    },
    {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9e9e9e'}]
    },
    {
        featureType: 'transit',
        stylers: [{visibility: 'off'}]
    },
    {
        featureType: 'transit.line',
        elementType: 'geometry',
        stylers: [{color: '#e5e5e5'}]
    },
    {
        featureType: 'transit.station',
        elementType: 'geometry',
        stylers: [{color: '#eeeeee'}]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{color: '#a3ccff'}]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9e9e9e'}]
    }
]);

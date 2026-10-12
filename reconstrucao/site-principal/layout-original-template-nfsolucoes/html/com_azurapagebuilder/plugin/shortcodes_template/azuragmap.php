<?php 
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
defined('_JEXEC') or die;

?>
<!--map-->
<div class="mapbox">
	<div class="map-decor"></div>
	<div class="close-map">
		<img src="<?php echo JURI::root(true).'/';?>images/gmap/close-white.png" alt="Close">
		<div class="triangle"></div>
	</div>
	<div id="map_canvas"></div>
</div>

<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>

<script>
// google map styles and functions  --------

var map;
// your coordinates   --------
var cashemir = new google.maps.LatLng( <?php echo $gmaplat;?>,<?php echo $gmaplog;?>);	
function initialize() {	
	var styles = [
		{
			featureType: 'water',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -100 },
				{ lightness: -18 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'landscape',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -100 },
				{ lightness: -78 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'road',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -100 },
				{ lightness: -34 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'road.local',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -115 },
				{ lightness: -12 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'poi.park',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -100 },
				{ lightness: -3 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'poi',
			elementType: 'all',
			stylers: [
				{ hue: '#292929' },
				{ saturation: -500 },
				{ lightness: -3 },
				{ visibility: 'on' }
			]
		},{
			featureType: 'transit',
			elementType: 'all',
			stylers: [
				{ hue: '#212121' },
				{ saturation: -20 },
				{ lightness: -2 },
				{ visibility: 'on' }
			]
		}
	
	  ];  
	  var mapOptions = {
		zoom:<?php echo $gmapzoom;?>,
		panControl:<?php echo ($gmappancontrol == '1')? 'true' : 'false';?>, 
		zoomControl: <?php echo ($gmapzoomcontrol == '1')? 'true' : 'false';?>,
		mapTypeControl: <?php echo ($gmaptypecontrol == '1')? 'true' : 'false';?>,
		streetViewControl: <?php echo ($gmapstreetviewcontrol == '1')? 'true' : 'false';?>,
		scaleControl: false,
		scrollwheel: <?php echo ($gmapscrollwheel == '1')? 'true' : 'false';?>,
		disableDefaultUI:true,
		center: cashemir,
		mapTypeControlOptions: {
		   mapTypeIds: [google.maps.MapTypeId.<?php echo $gmaptypeid;?>, 'bestfromgoogle']
		}
	  };
	map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);
	var styledMapOptions = {
		  name: "cashemir"
	}	
	var jayzMapType = new google.maps.StyledMapType(
		styles, styledMapOptions);
	map.mapTypes.set('bestfromgoogle', jayzMapType);
	map.setMapTypeId('bestfromgoogle');				
	var companyImage = new google.maps.MarkerImage('<?php echo JURI::root(true).'/';?>images/gmap/marker.png',
		new google.maps.Size(30,30),
		new google.maps.Point(0,0),
		new google.maps.Point(28,58)
	);
	// your marker coordinates   --------
	var companyPos = new google.maps.LatLng( <?php echo $gmaplat;?>,<?php echo $gmaplog;?>);
	var companyMarker = new google.maps.Marker({
		position: companyPos,
		map: map,
		icon: companyImage,
		zIndex: 3
	});
}
$(document).ready(function(){
		initialize();	
	});
</script>
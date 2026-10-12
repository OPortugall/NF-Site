<?php
/**
 * @package Azura Joomla Pagebuilder
 * @author Cththemes - www.cththemes.com
 * @date: 15-07-2014
 *
 * @copyright  Copyright ( C ) 2014 cththemes.com . All rights reserved.
 * @license    GNU General Public License version 2 or later; see LICENSE
 */
//no direct accees
defined ('_JEXEC') or die('resticted aceess');

//[carousel]
if(!function_exists('azuraservicesslider_sc')) {
	$AzuraServicesSliderArray = array();
	function azuraservicesslider_sc( $atts, $content="" ){
		global $AzuraServicesSliderArray;
		
		$params = shortcode_atts(array(
			  'id' => 'azp-services',
			  'class'=>'azp-services',
			  'itemactive'=>'2'
		 ), $atts);

		$slideID = uniqid($params['id']);
		
		do_shortcode( $content );

		$html = array();

		$part1 = array();
		$part2 = array();
		
		if((int)$params['itemactive'] > 0 && (int)$params['itemactive'] <= count($AzuraServicesSliderArray)){
			$itemactive = (int) $params['itemactive'];
		}else{
			$itemactive = 1;
		}

		//services
		foreach ($AzuraServicesSliderArray as $key=>$azuraService) {

			
			$part1[] = '<div class="service_box '.(($key+1 == $itemactive)? 'actser ': '').'animaper">';
				
				$part1[] = '<a name="'.$key.'" class="animbox">'.$azuraService['title'].'</a>';
				
			$part1[] = '</div>';


			$part2[] = '<!-- slide-'.($key+1).' -->';
			$part2[] = '<li>';
			if(!empty($azuraService['iconclass'])){
				$part2[] = '<div class="icon-holder">';
					$part2[] = '<i class="'.$azuraService['iconclass'].'"></i>';
				$part2[] = '</div>';
			}
				$part2[] = '<h3><span></span>'.$azuraService['title'].'<span></span></h3>';
				$part2[] = do_shortcode($azuraService['content']);
			$part2[] = '</li>';
		}

		$html[] = '<div class="container">';
			$html[] = '<div class="row" id="service_boxes">';
						
				$html[] = implode("\n", $part1);
				
			$html[] = '</div>';

		$html[] = '</div>';
		
		$html[] = '	<div class="serviseslider-holder no-nav">';
			$html[] = '	<div class="container">';
				$html[] = '	<div id="'.$slideID.'" class="serviseslider">';
					$html[] = '	<ul class="slides">';
				
						$html[] = implode("\n", $part2);
						
					$html[] = '	</ul>';
				$html[] = '	</div>';
			$html[] = '	</div>';
		$html[] = '	</div>';
	
		$AzuraServicesSliderArray = array();	

		ob_start();

		echo implode("\n", $html); ?>
		
		<script type="text/javascript">

		jQuery(document).ready(function($){
			$('#<?php echo $slideID;?>').flexslider({
				animation: "slide",
				smoothHeight: true,
				slideshow: false,
				controlNav: false,              
				directionNav: false,
				startAt: <?php echo $itemactive-1;?>, 
				start: function(slider) {			
		            $('a.animbox').click(function() {
		                var slideTo = $(this).attr("name")
		                var slideToInt = parseInt(slideTo)
						var ww = $(window).width();			
		                if (slider.currentSlide != slideToInt) 
						{					
		                    slider.flexAnimate(slideToInt)
		                }				
						if(ww < 959){									
							setTimeout( function(){
								$('html').scrollTo('#<?php echo $slideID;?>',800,{'axis':'y'} );									
							},600);							
						}
		            });
		        }
			});
		});
			
		</script>

	<?php

		$data = ob_get_clean();
			
		return $data;

	}
	
	add_shortcode( 'AzuraServicesSlider', 'azuraservicesslider_sc' );
		
	//carousel Items
	function azuraservicesslider_item_sc( $atts, $content="" ){
		global $AzuraServicesSliderArray;
		$AzuraServicesSliderArray[] = array('id'=>(!empty($atts['id'])? $atts['id'] : ''), 'class'=>(!empty($atts['class'])? $atts['class'] : ''),'title'=>(!empty($atts['title'])? $atts['title'] : ''),'iconclass'=>(!empty($atts['iconclass'])? $atts['iconclass'] : ''), 'content'=>$content);
	}

	add_shortcode( 'AzuraServicesSliderItem', 'azuraservicesslider_item_sc' );			
}
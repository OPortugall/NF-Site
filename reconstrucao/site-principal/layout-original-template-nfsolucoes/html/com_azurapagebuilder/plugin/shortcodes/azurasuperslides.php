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
if(!function_exists('azurasuperslides_sc')) {
	$AzuraSuperSlideArray = array();
	function azurasuperslides_sc( $atts, $content="" ){
		global $AzuraSuperSlideArray;
		
		$params = shortcode_atts(array(
			  'id' => 'slides',
			  'class'=>'',
			  'play'=>'0',
			  'animation'=>'slide',
			  'animationspeed'=>'normal',
			  'animationeasing'=>'linear',
			  'pagination'=>'1',
			  'slidecontainerwrapper'=>'div',
			  'slidecontainer'=>'slides-container',
			  'slideitemwrapper'=>'div',
			  'paginationcontainer'=>'slides-pagination',
			  'navigationcontainer'=>'slides-navigation',
			  'preserve'=>'preserve'
		 ), $atts);

		$classes = 'azp-superslides';
		if ($params['class']) {
			$classes .= ' '.$params['class'];
		}

		$classes = 'class="'.$classes.'"';

		
		do_shortcode( $content );

		
		$html = '<div id="' . $params['id'] . '" '.$classes.'>';

			$html .= '<'.$params['slidecontainerwrapper'].' class="' . $params['slidecontainer'].'">';

			//slides
			foreach ($AzuraSuperSlideArray as $key=>$azuraSuper) {
				$html .='<'.$params['slideitemwrapper'].' class="azp-item'. (!empty($azuraSuper['class']) ? " ".$azuraSuper['class'] : "").'" '. (!empty($azuraSuper['id']) ? " id=\"".$azuraSuper['id']."\"" : "").'>';
	                $html .= do_shortcode( $azuraSuper['content'] );

		            if(!empty($azuraSuper['bgimage'])){
		            	$html .='<div style="background-image: url(\''.JURI::base(true).'/'.$azuraSuper['bgimage'].'\');" class="azp-item-bgimage '.(!empty($azuraSuper['bgclass']) ? " ".$azuraSuper['bgclass'] : "").'"></div>';
		            }
	            
	            $html .='</'.$params['slideitemwrapper'].'>';
			}

			$html .= '</'.$params['slidecontainerwrapper'].'>';

			$html .= '<div class="'.$params['navigationcontainer'].'">';
			  $html .= '<a href="#" class="prev"><i class="fa fa-long-arrow-left fa-2x"></i></a>';
			  $html .= '<a href="#" class="next"><i class="fa fa-long-arrow-right fa-2x"></i></a>';
			$html .= '</div>';
		
		$html .='</div>';
	
		$AzuraSuperSlideArray = array();	

		ob_start();

		echo $html; ?>
		
		<script>

		 	jQuery('#<?php echo $params['id'];?>').superslides({
			  	play: <?php echo $params['play'];?>,
			  	animation: '<?php echo $params['animation'];?>',
			  	animation_speed: '<?php echo $params['animationspeed'];?>',
			  	animation_easing: '<?php echo $params['animationeasing'];?>',

			  	pagination:<?php echo (($params['pagination'] == '1' )? 'true' : 'false');?>,

			  	//elements: {
			  		//preserve: '.<?php echo $params['preserve'];?>',
			  		//nav: '.<?php echo $params['navigationcontainer'];?>',
			  		//pagination: '.<?php echo $params['paginationcontainer'];?>'
			  	//}
		    });

		</script>

	<?php

		$data = ob_get_clean();
			
		return $data;

	}
	
	add_shortcode( 'AzuraSuperSlides', 'azurasuperslides_sc' );
		
	//carousel Items
	function azurasuperslides_item_sc( $atts, $content="" ){
		global $AzuraSuperSlideArray;
		$AzuraSuperSlideArray[] = array('id'=>(!empty($atts['id'])? $atts['id'] : ''), 'class'=>(!empty($atts['class'])? $atts['class'] : ''),'bgimage'=>(!empty($atts['bgimage'])? $atts['bgimage'] : ''),'bgclass'=>(!empty($atts['bgclass'])? $atts['bgclass'] : ''), 'content'=>$content);
	}

	add_shortcode( 'AzuraSuperSlidesItem', 'azurasuperslides_item_sc' );			
}
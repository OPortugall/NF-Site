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
if(!function_exists('azuracarouselslider_sc')) {
	$AzuraCarouselSliderArray = array();
	function azuracarouselslider_sc( $atts, $content="" ){
		global $AzuraCarouselSliderArray;
		
		$params = shortcode_atts(array(
			  'id' => 'owl-demo',
			  'class'=>'',
			  'transtyle'=>'',
			  'sliderspeed'=>'',
			  'rewindspeed'=>'',
			  'slideperview'=>'',
			  'itemscustom'=>'',
			  'autoplay'=>'',
			  'pagination'=>'',
			  'paginationspeed'=>'',
			  'navigation'=>'',
			  'autoheight'=>'',
			  'mousedrag'=>'',
			  'touchdrag'=>'',
			  'layout'=>''
		 ), $atts);

		//echo'<pre>';var_dump($params);die;

		//$slideID = uniqid($params['id']);

		$classes = 'azp-carousel';
		if ($params['class']) {
			$classes .= ' '.$params['class'];
		}

		$classes = 'class="'.$classes.'"';

		
		do_shortcode( $content );

		
		$html = '<div id="' . $params['id'] . '" '.$classes.'>';

		// //indicators
		// if($params['indicator'] == 'true'){
		// 	$html .= '<ol class="carousel-indicators">';
		// 	foreach ($AzuraCarouselSliderArray as $key=>$carousel) {
		// 		$html .='<li data-target="#'.$params['id'].'" data-slide-to="'.$key.'" '. ( ($key==0) ? 'class="active"' : '').' ></li>';
		// 	}
		// 	$html .= '</ol>';
		// }


		$shortcodeTemp = false;

		if(stripos($params['layout'], '_:') !== false){
			$shortcodeTemp = JPATH_PLUGINS . '/system/cthshortcodes/shortcodes_template/'.substr($params['layout'], 2).'.php';
		}else{
			if(stripos($params['layout'], ':') !== false){
				$shortcodeTemp = JPATH_THEMES .'/'.JFactory::getApplication()->getTemplate(). '/html/com_azurapagebuilder/plugin/shortcodes_template/'.substr($params['layout'], stripos($params['layout'], ':')+1).'.php';
			}else{
				$shortcodeTemp = CthShortcodes::addShortcodeTemplate('azuracarouselslider');
			}
		}


		
		
		$buffer = ob_get_clean();
		
		ob_start();
		
		//if($shortcodeTemp !== false) require $shortcodeTemp;
		
		// $content = ob_get_clean();
		
		// ob_start();
		
		// echo $buffer;
		
		//carousels
		foreach ($AzuraCarouselSliderArray as $key=>$azuraCarousel) {
			if($shortcodeTemp !== false) require $shortcodeTemp;

			// $html .='<div class="item'. (!empty($azuraCarousel['class']) ? " ".$azuraCarousel['class'] : "").'" '. (!empty($azuraCarousel['id']) ? " id=\"".$azuraCarousel['id']."\"" : "").'>';
   //          if(!empty($azuraCarousel['image'])){
   //              $html .= '<img alt="About '.(JFactory::getApplication()->getCfg('sitename')).'" src="'.JURI::base(true).'/'.$azuraCarousel['image'].'">';
   //          }else{
   //              $html .= do_shortcode( $azuraCarousel['content'] );
   //          }
            
   //          $html .='</div>';
		}

		$html .= ob_get_clean();
		
		ob_start();
		
		echo $buffer;

		
		$html .='</div>';
	
		$AzuraCarouselSliderArray = array();	

		ob_start();

		echo $html; ?>
		
		<script>

			owl_<?php echo str_replace("-","_",$params['id']);?> = jQuery('#<?php echo $params['id'];?>');
			
			owl_<?php echo str_replace("-","_",$params['id']);?>.owlCarousel({	

				autoPlay : <?php echo (($params['autoplay'] == '1')? 'true' : 'false');?>,
			
				navigation : <?php echo (($params['navigation'] == '1' )? 'true' : 'false');?>,

				pagination:<?php echo (($params['pagination'] == '1' )? 'true' : 'false');?>,

			<?php if((int)$params['slideperview'] == 1) :?>
				singleItem : true,
			<?php else: ?>
				items : <?php echo (int)$params['slideperview'];?>,
			<?php endif;?>

			<?php if(!empty($params['itemscustom'])): ?>
				itemsCustom : <?php echo $params['itemscustom'];?>,
			<?php endif;?>	

			<?php if(!empty($params['sliderspeed'])): ?>
				slideSpeed : <?php echo $params['sliderspeed'];?>,
			<?php endif;?>	

			<?php if(!empty($params['paginationspeed'])): ?>
				paginationSpeed : <?php echo $params['paginationspeed'];?>,
			<?php endif;?>

			<?php if(!empty($params['rewindspeed'])): ?>
				rewindSpeed : <?php echo $params['rewindspeed'];?>,
			<?php endif;?>

				autoHeight : <?php echo (($params['autoheight'] == '1' )? 'true' : 'false');?>,
				mouseDrag:	<?php echo (($params['mousedrag'] == '1' )? 'true' : 'false');?>,	
				touchDrag:<?php echo (($params['touchdrag'] == '1' )? 'true' : 'false');?>,
			<?php if(!empty($params['transtyle'])): ?>
				transitionStyle : "<?php echo $params['transtyle'];?>"
			<?php endif;?>		   
			});
		</script>

	<?php

		$data = ob_get_clean();
			
		return $data;

	}
	
	add_shortcode( 'AzuraCarouselSlider', 'azuracarouselslider_sc' );
		
	//carousel Items
	function azuracarouselslider_item_sc( $atts, $content="" ){
		global $AzuraCarouselSliderArray;
		$AzuraCarouselSliderArray[] = array('id'=>(!empty($atts['id'])? $atts['id'] : ''), 'class'=>(!empty($atts['class'])? $atts['class'] : ''),'image'=>(!empty($atts['slideimage'])? $atts['slideimage'] : ''), 'content'=>$content);
	}

	add_shortcode( 'AzuraCarouselSliderItem', 'azuracarouselslider_item_sc' );			
}
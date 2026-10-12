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

//[Icon]
if(!function_exists('azuraimage_sc')) {

	function azuraimage_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class'=>'',
               'title'=>''

		 ), $atts));

		
		$classes = "azp_image";

		if(!empty($class)){
			$classes .= ' '.$class;
		}

		$classes = 'class="'.$classes.'"';
		 
		if(!empty($id)){
			$id = 'id="'.$id.'"';
		}
        
        $html = '<img '.$id.' '.$classes.' alt="'.$title.'" title="'.$title.'" src="'.JURI::root(true).'/'.$content.'">';
		
		return $html;
        
	 
	}
		
	add_shortcode( 'AzuraImage', 'azuraimage_sc' );
}
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
if(!function_exists('azuracontainer_sc')) {

	function azuracontainer_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class' => '',
			   'bgimage'=>'',
               'wrappertag'=>'div',
               'title'=>''
		 ), $atts));

		
		$classes = "azp_container";

		if(!empty($class)){
			$classes .= ' '.$class;
		}

		$classes = 'class="'.$classes.'"';
		 
		if(!empty($id)){
			$id = 'id="'.$id.'"';
		}
		
		$html = '<'.$wrappertag.' '.$id.' '.$classes.' '.(!empty($bgimage)? 'style="background-image: url(\''.JURI::base(true).'/'.$bgimage.'\');"':'').'>';
		if(!empty($title)){
			$html .='<div class="title">';
				$html .='<h2>'.$title.'</h2>';
			$html .='</div>';
		}
			$html .= do_shortcode($content);
		$html .= '</'.$wrappertag.'>';
		
		return $html;
	 
	}
		
	add_shortcode( 'AzuraContainer', 'azuracontainer_sc' );
}
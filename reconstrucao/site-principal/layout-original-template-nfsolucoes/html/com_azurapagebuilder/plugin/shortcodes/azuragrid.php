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
if(!function_exists('azuragrid_sc')) {

	function azuragrid_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'extraclass' => '',
			   'wrappertag'=>'',
			   'gridwidthclass'=>'span12'
		 ), $atts));


		if(!empty($extraclass)){
			$gridwidthclass .= ' '.$extraclass;
		}

		$gridwidthclass = 'class="'.$gridwidthclass.'"';
		 
		if(!empty($id)){
			$id = 'id="'.$id.'"';
		}
		 
		return '<'.$wrappertag.' '.$id.' '.$gridwidthclass.'>'. do_shortcode($content).'</'.$wrappertag.'>';
	 
	}
		
	add_shortcode( 'AzuraGrid', 'azuragrid_sc' );
}
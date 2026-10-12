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
if(!function_exists('azurahtml_sc')) {

	function azurahtml_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
		 ), $atts));
		 
		return do_shortcode($content);
	 
	}
		
	add_shortcode( 'AzuraHtml', 'azurahtml_sc' );
}
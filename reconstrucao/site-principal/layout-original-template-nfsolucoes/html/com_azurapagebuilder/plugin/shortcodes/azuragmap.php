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
if(!function_exists('azuragmap_sc')) {

	function azuragmap_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class' => '',
			   'gmaplat'=>'',
			   'gmaplog'=>'',
			   'gmappancontrol'=>'',
			   'gmapzoomcontrol' => '',
			   'gmaptypecontrol' => '',
			   'gmapstreetviewcontrol'=>'',
			   'gmapscrollwheel'=>'',
			   'gmapzoom'=>'',
			   'gmaptypeid'=>''
		 ), $atts));

		$shortcodeTemp = false;

		$shortcodeTemp = CthShortcodes::addShortcodeTemplate('azuragmap');


		
		
		$buffer = ob_get_clean();
		
		ob_start();
		
		if($shortcodeTemp !== false) require $shortcodeTemp;
		
		$content = ob_get_clean();
		
		ob_start();
		
		echo $buffer;
		
		return $content;

	}
		
	add_shortcode( 'AzuraGMap', 'azuragmap_sc' );
}
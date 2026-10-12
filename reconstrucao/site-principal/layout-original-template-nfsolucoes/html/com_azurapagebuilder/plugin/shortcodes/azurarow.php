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
if(!function_exists('azurarow_sc')) {

	function azurarow_sc( $atts, $content="" ) {
	
		extract(shortcode_atts(array(
			   'id' => '',
			   'class' => '',
			   'layout'=>''
		 ), $atts));

		$shortcodeTemp = false;

		if(stripos($layout, '_:') !== false){
			$shortcodeTemp = JPATH_PLUGINS . '/system/cthshortcodes/shortcodes_template/'.substr($layout, 2).'.php';
		}else{
			if(stripos($layout, ':') !== false){
				$shortcodeTemp = JPATH_THEMES .'/'.JFactory::getApplication()->getTemplate(). '/html/com_azurapagebuilder/plugin/shortcodes_template/'.substr($layout, stripos($layout, ':')+1).'.php';
			}else{
				$shortcodeTemp = CthShortcodes::addShortcodeTemplate('azurarow');
			}
		}


		
		
		$buffer = ob_get_clean();
		
		ob_start();
		
		if($shortcodeTemp !== false) require $shortcodeTemp;
		
		$content = ob_get_clean();
		
		ob_start();
		
		echo $buffer;
		
		return $content;

		
	}
		
	add_shortcode( 'AzuraRow', 'azurarow_sc' );
}
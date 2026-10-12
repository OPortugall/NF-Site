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


//[Tab]
if(!function_exists('azuratabtoggle_sc')) {
	$azuraTabToggleArray = array();
	function azuratabtoggle_sc( $atts, $content="" ){
		global $azuraTabToggleArray;
		
		$params = shortcode_atts(array(
			  'id' => '',
			  'class'=>'',
			  'style'=>'tab',
			  'defaultactive'=>'',
			  'layout'=>''
		 ), $atts);
		
		do_shortcode( $content );

		

		$shortcodeTemp = false;

		if(stripos($params['layout'], '_:') !== false){
			$shortcodeTemp = JPATH_PLUGINS . '/system/cthshortcodes/shortcodes_template/'.substr($params['layout'], 2).'.php';
		}else{
			if(stripos($params['layout'], ':') !== false){
				$shortcodeTemp = JPATH_THEMES .'/'.JFactory::getApplication()->getTemplate(). '/html/com_azurapagebuilder/plugin/shortcodes_template/'.substr($params['layout'], stripos($params['layout'], ':')+1).'.php';
			}else{
				$shortcodeTemp = CthShortcodes::addShortcodeTemplate('azuratabtoggle');
			}
		}


		
		
		$buffer = ob_get_clean();
		
		ob_start();
		
		if($shortcodeTemp !== false) require $shortcodeTemp;
		
		$content = ob_get_clean();
		
		ob_start();
		
		echo $buffer;

		
		$azuraTabToggleArray = array();
		
		return $content;
	}
	add_shortcode( 'AzuraTabToggle', 'azuratabtoggle_sc' );
	
	//Tab Items
	function azuratabtoggle_item_sc( $atts, $content="" ){
		global $azuraTabToggleArray;
		$azuraTabToggleArray[] = array('id'=>(!empty($atts['id'])? $atts['id'] : ''), 'class'=>(!empty($atts['class'])? $atts['class'] : ''),'title'=>(!empty($atts['title'])? $atts['title'] : ''), 'iconclass'=>(!empty($atts['iconclass'])? $atts['iconclass'] : ''), 'content'=>$content);
	}

	add_shortcode( 'AzuraTabToggleItem', 'azuratabtoggle_item_sc' );	
}
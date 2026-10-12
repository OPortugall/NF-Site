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

//[social buttons]
if(!function_exists('azurasocialbuttons_sc')) {
	$AzuraSocialButtonsArray = array();
	function azurasocialbuttons_sc( $atts, $content="" ){
		global $AzuraSocialButtonsArray;
		
		$params = shortcode_atts(array(
			  'wrapper' => 'ul',
			  'id'=>'',
			  'class'=>'',
			  'customstyle'=>'',
			  'layout'=>''
		 ), $atts);

		$classes = 'azp-socialbuttons';
		if ($params['class']) {
			$classes .= ' '.$params['class'];
		}

		$classes = 'class="'.$classes.'"';

		if(!empty($params['id'])){
			$params['id'] = 'id="'.$params['id'].'"';
		}

		if(!empty($params['customstyle'])){
			$params['customstyle'] = 'style="'.$params['customstyle'].'"';
		}

		
		do_shortcode( $content );

		
		$html = '<'.$params['wrapper'].' ' . $params['id'] . ' '.$classes.' '.$params['customstyle'].'>';

		$shortcodeTemp = false;

		if(stripos($params['layout'], '_:') !== false){
			$shortcodeTemp = JPATH_PLUGINS . '/system/cthshortcodes/shortcodes_template/'.substr($params['layout'], 2).'.php';
		}else{
			if(stripos($params['layout'], ':') !== false){
				$shortcodeTemp = JPATH_THEMES .'/'.JFactory::getApplication()->getTemplate(). '/html/com_azurapagebuilder/plugin/shortcodes_template/'.substr($params['layout'], stripos($params['layout'], ':')+1).'.php';
			}else{
				$shortcodeTemp = CthShortcodes::addShortcodeTemplate('azurasocialbuttons');
			}
		}

		$buffer = ob_get_clean();
		
		ob_start();

		foreach ($AzuraSocialButtonsArray as $key=>$button) {
			if($shortcodeTemp !== false) require $shortcodeTemp;
		}

		$html .= ob_get_clean();
		
		ob_start();
		
		echo $buffer;

		
		$html .='</'.$params['wrapper'].'>';
	
		$AzuraSocialButtonsArray = array();	

		ob_start();

		echo $html;

		$data = ob_get_clean();
			
		return $data;

	}
	
	add_shortcode( 'AzuraSocialButtons', 'azurasocialbuttons_sc' );
		
	//button
	function azurasocialbuttons_button_sc( $atts, $content="" ){
		global $AzuraSocialButtonsArray;
		$AzuraSocialButtonsArray[] = array('id'=>(!empty($atts['id'])? $atts['id'] : ''), 'class'=>(!empty($atts['class'])? $atts['class'] : ''),'link'=>(!empty($atts['link'])? $atts['link'] : ''),'target'=>(!empty($atts['target'])? $atts['target'] : ''), 'iconclass'=>(!empty($atts['iconclass'])? $atts['iconclass'] : ''),'text'=>(!empty($atts['text'])? $atts['text'] : ''),'tooltip'=>(!empty($atts['tooltip'])? $atts['tooltip'] : ''), 'tooltiptitle'=>(!empty($atts['tooltiptitle'])? $atts['tooltiptitle'] : ''),'backgroundcolor'=>(!empty($atts['backgroundcolor'])? $atts['backgroundcolor'] : '') ,'customstyle'=>(!empty($atts['customstyle'])? $atts['customstyle'] : ''), 'content'=>$content);
	}

	add_shortcode( 'AzuraSocialButtonsButton', 'azurasocialbuttons_button_sc' );			
}